import { type KwilSigner, NodeKwil } from "@idos-network/kwil-js";
import { BlobGateway, type BlobGatewayParams } from "@idos-network/utils/blob-gateway";

import type { KwilActionClient } from "./create-kwil-client";

const KGW_AUTH_ERROR_CODE = -901;

export type KgwAuthFailurePredicate = (response: Response) => Promise<boolean> | boolean;

export type CreateKgwAuthenticatedFetchParams = {
  kwilClient: KwilActionClient;
  signer: KwilSigner;
  fetchFn?: typeof fetch;
  isAuthFailure?: KgwAuthFailurePredicate;
};

export type CreateKgwAuthenticatedBlobGatewayParams = CreateKgwAuthenticatedFetchParams & {
  url: string;
  maxFetchBytes?: BlobGatewayParams["maxFetchBytes"];
};

type KgwSessionNodeKwil = NodeKwil & {
  authenticateKGWAndSetCookie(signer: KwilSigner): Promise<string>;
  getKgwCookie(): string | undefined;
};

export function createKgwAuthenticatedBlobGateway({
  url,
  maxFetchBytes,
  ...fetchParams
}: CreateKgwAuthenticatedBlobGatewayParams): BlobGateway {
  return new BlobGateway({
    url,
    maxFetchBytes,
    fetchFn: createKgwAuthenticatedFetch(fetchParams),
  });
}

export function createKgwAuthenticatedFetch({
  kwilClient,
  signer,
  fetchFn = fetch,
  isAuthFailure = defaultKgwAuthFailurePredicate,
}: CreateKgwAuthenticatedFetchParams): typeof fetch {
  const nodeKwil = getNodeKwilClient(kwilClient);
  let refreshPromise: Promise<string> | undefined;

  const refreshCookie = async (): Promise<string> => {
    refreshPromise ??= nodeKwil.authenticateKGWAndSetCookie(signer).finally(() => {
      refreshPromise = undefined;
    });

    return refreshPromise;
  };

  const ensureCookie = async (): Promise<{ cookie: string; refreshed: boolean }> => {
    const existingCookie = nodeKwil.getKgwCookie();
    if (existingCookie) {
      return { cookie: existingCookie, refreshed: false };
    }

    return { cookie: await refreshCookie(), refreshed: true };
  };

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const { cookie, refreshed } = await ensureCookie();
    const requestUrl = requestUrlFromInput(input);
    console.log("kgw authenticated fetch request");
    console.log(
      JSON.stringify(
        {
          url: requestUrl,
          had_cookie_before_request: !refreshed,
          refreshed_before_request: refreshed,
          sends_cookie_header: true,
        },
        null,
        2,
      ),
    );
    const response = await fetchFn(...withCookie(input, init, cookie));

    if (!(await isAuthFailure(response.clone()))) {
      console.log("kgw authenticated fetch response");
      console.log(
        JSON.stringify(
          {
            url: requestUrl,
            status: response.status,
            ok: response.ok,
            reauthenticated: false,
          },
          null,
          2,
        ),
      );
      return response;
    }

    console.log("kgw authenticated fetch auth failure");
    console.log(
      JSON.stringify(
        {
          url: requestUrl,
          status: response.status,
          action: "reauthenticate_and_retry",
        },
        null,
        2,
      ),
    );
    const refreshedCookie = await refreshCookie();
    const retryResponse = await fetchFn(...withCookie(input, init, refreshedCookie));
    console.log("kgw authenticated fetch retry response");
    console.log(
      JSON.stringify(
        {
          url: requestUrl,
          status: retryResponse.status,
          ok: retryResponse.ok,
          reauthenticated: true,
        },
        null,
        2,
      ),
    );

    return retryResponse;
  };
}

function getNodeKwilClient(kwilClient: KwilActionClient): KgwSessionNodeKwil {
  if (!(kwilClient.client instanceof NodeKwil)) {
    throw new Error("KGW authenticated fetch can only be created from a NodeKwil client");
  }

  if (!hasKgwSessionHelpers(kwilClient.client)) {
    throw new Error("NodeKwil client does not expose KGW session cookie helpers");
  }

  return kwilClient.client;
}

function hasKgwSessionHelpers(client: NodeKwil): client is KgwSessionNodeKwil {
  const maybeClient = client as Partial<KgwSessionNodeKwil>;

  return (
    typeof maybeClient.getKgwCookie === "function" &&
    typeof maybeClient.authenticateKGWAndSetCookie === "function"
  );
}

function withCookie(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  cookie: string,
): Parameters<typeof fetch> {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);

  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  headers.set("Cookie", cookie);

  return [input, { ...init, headers }];
}

function requestUrlFromInput(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  return input instanceof URL ? input.toString() : input.url;
}

async function defaultKgwAuthFailurePredicate(response: Response): Promise<boolean> {
  if (response.status === 401) {
    return true;
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return false;
  }

  try {
    const body = (await response.json()) as { error?: { code?: number } };
    return body.error?.code === KGW_AUTH_ERROR_CODE;
  } catch {
    return false;
  }
}
