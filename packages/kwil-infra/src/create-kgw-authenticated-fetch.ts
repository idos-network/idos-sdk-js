import { type KwilSigner, NodeKwil } from "@idos-network/kwil-js";
import { BlobGateway } from "@idos-network/utils/blob-gateway";

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
};

type KgwSessionNodeKwil = NodeKwil & {
  authenticateKGWAndSetCookie(signer: KwilSigner): Promise<string>;
  getKgwCookie(): string | undefined;
};

export function createKgwAuthenticatedBlobGateway({
  url,
  ...fetchParams
}: CreateKgwAuthenticatedBlobGatewayParams): BlobGateway {
  return new BlobGateway({
    url,
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

  const ensureCookie = async (): Promise<string> => nodeKwil.getKgwCookie() ?? refreshCookie();

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const cookie = await ensureCookie();
    const response = await fetchFn(...withCookie(input, init, cookie));

    if (!(await isAuthFailure(response.clone()))) {
      return response;
    }

    const refreshedCookie = await refreshCookie();
    return fetchFn(...withCookie(input, init, refreshedCookie));
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
