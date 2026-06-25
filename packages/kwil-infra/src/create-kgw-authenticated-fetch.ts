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
    const { cookie } = await ensureCookie();
    const bufferedRequest = await bufferRequestBody(input, init);
    const response = await fetchFn(
      ...withCookie(input, withMaterializedBody(bufferedRequest), cookie),
    );

    if (!(await isAuthFailure(response.clone()))) {
      return response;
    }

    const refreshedCookie = await refreshCookie();
    return fetchFn(...withCookie(input, withMaterializedBody(bufferedRequest), refreshedCookie));
  };
}

type BufferedFormDataEntry =
  | { key: string; value: string }
  | { key: string; value: ArrayBuffer; fileName: string; type: string };

type BufferedBody =
  | { kind: "body"; value: BodyInit }
  | { kind: "form-data"; entries: BufferedFormDataEntry[] };

type BufferedRequestBody = {
  requestInit: RequestInit | undefined;
  bufferedBody?: BufferedBody;
};

async function bufferRequestBody(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<BufferedRequestBody> {
  if (init?.body != null) {
    return {
      requestInit: init,
      bufferedBody: await bufferBody(init.body),
    };
  }

  if (input instanceof Request && input.body != null) {
    return {
      requestInit: {
        ...init,
        method: init?.method ?? input.method,
      },
      bufferedBody: await bufferBody(input.body),
    };
  }

  return { requestInit: init };
}

function withMaterializedBody({
  requestInit,
  bufferedBody,
}: BufferedRequestBody): RequestInit | undefined {
  if (!bufferedBody) {
    return requestInit;
  }

  return {
    ...requestInit,
    body: materializeBody(bufferedBody),
  };
}

async function bufferBody(body: BodyInit): Promise<BufferedBody> {
  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  ) {
    return { kind: "body", value: body };
  }

  if (ArrayBuffer.isView(body)) {
    return {
      kind: "body",
      value: new Uint8Array(body.buffer, body.byteOffset, body.byteLength),
    };
  }

  if (body instanceof FormData) {
    const entries: Promise<BufferedFormDataEntry>[] = [];

    body.forEach((value, key) => {
      entries.push(bufferFormDataEntry(key, value));
    });

    return { kind: "form-data", entries: await Promise.all(entries) };
  }

  if (body instanceof ReadableStream) {
    return {
      kind: "body",
      value: await new Response(body).arrayBuffer(),
    };
  }

  return { kind: "body", value: body };
}

async function bufferFormDataEntry(
  key: string,
  value: FormDataEntryValue,
): Promise<BufferedFormDataEntry> {
  if (typeof value === "string") {
    return { key, value };
  }

  return {
    key,
    value: await new Response(value).arrayBuffer(),
    fileName: value instanceof File ? value.name : "blob",
    type: value.type || "application/octet-stream",
  };
}

function materializeBody(bufferedBody: BufferedBody): BodyInit {
  if (bufferedBody.kind === "body") {
    return bufferedBody.value;
  }

  const formData = new FormData();

  for (const entry of bufferedBody.entries) {
    if ("fileName" in entry) {
      formData.append(entry.key, new Blob([entry.value], { type: entry.type }), entry.fileName);
    } else {
      formData.append(entry.key, entry.value);
    }
  }

  return formData;
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
