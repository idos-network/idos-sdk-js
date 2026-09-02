import { of as ipfsOnlyHash } from "ipfs-only-hash";

import { base64Decode } from "../codecs";

export type BlobContentReference = {
  cid: string;
  uri: string;
  size: number;
};

export type BlobGatewayUploadResponse = {
  request_id: string;
  original_cid?: string;
  copy_cid?: string;
  quorum?: number;
};

export type BlobGatewayParams = {
  url: string;
  fetchFn?: typeof fetch;
  maxFetchBytes?: number;
  /** MM / UKYC capability token. Sent as `Authorization: AccessToken …` on blob requests. */
  accessToken?: string;
};

type CredentialBlobParts =
  | { original: Uint8Array; copy: Uint8Array }
  | { original: Uint8Array; copy?: undefined }
  | { original?: undefined; copy: Uint8Array };

export type UploadCredentialBlobsParams = {
  requestId: string;
} & CredentialBlobParts;

export type FetchBlobParams = {
  credentialId: string;
  contentUri?: string | null;
  expectedSize?: number | string | bigint | null;
  maxBytes?: number;
};

export type DeleteCredentialBlobParams = {
  credentialId: string;
};

export type BlobBackedCredentialContent = {
  id: string;
  content?: string | null;
  content_uri?: string | null;
  content_size?: number | string | bigint | null;
};

export const IPFS_URI_PREFIX = "ipfs://";
export const UKYC_URI_PREFIX = "ukyc://";
export const DEFAULT_BLOB_GATEWAY_MAX_FETCH_BYTES: number = 20 * 1024 * 1024;
const MAX_BLOB_GATEWAY_ERROR_BYTES = 4 * 1024;

type BlobGatewayOperation = "upload" | "fetch" | "delete";

export class BlobGatewayHttpError extends Error {
  constructor(
    public readonly operation: BlobGatewayOperation,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
    public readonly detail?: string,
  ) {
    const context = [code, requestId ? `request ${requestId}` : undefined]
      .filter(Boolean)
      .join(", ");
    super(
      `blob gateway ${operation} failed with ${status}${context ? ` (${context})` : ""}` +
        `${detail ? `: ${detail}` : ""}`,
    );
    this.name = "BlobGatewayHttpError";
  }
}

export function isIpfsContentUri(uri: string | null | undefined): uri is string {
  return typeof uri === "string" && uri.startsWith(IPFS_URI_PREFIX);
}

export function isUkycContentUri(uri: string | null | undefined): uri is string {
  return typeof uri === "string" && uri.startsWith(UKYC_URI_PREFIX);
}

/** `ukyc://{storage_id}/blobs/{blob_id}` — `/blobs/` is required. */
export function createUkycContentUri(storageId: string, blobId: string): string {
  const trimmedStorageId = storageId.trim();
  const trimmedBlobId = blobId.trim();
  if (!trimmedStorageId || trimmedStorageId.includes("/")) {
    throw new Error("ukyc content uri requires a storage_id without path segments");
  }
  if (!trimmedBlobId || trimmedBlobId.includes("/")) {
    throw new Error("ukyc content uri requires a blob_id without path segments");
  }
  return `${UKYC_URI_PREFIX}${trimmedStorageId}/blobs/${trimmedBlobId}`;
}

export function requireAccessTokenForUkycContent(
  contentUri: string | null | undefined,
  hasAccessToken: boolean,
): void {
  if (isUkycContentUri(contentUri) && !hasAccessToken) {
    throw new Error(
      "A ukyc:// credential requires an accessToken; use MM authentication for this session",
    );
  }
}

const CID_IMPORT_POLICY = {
  cidVersion: 1,
  rawLeaves: true,
  chunker: "size-262144",
  hashAlg: "sha2-256",
  wrapWithDirectory: false,
  onlyHash: true,
} as const;

export async function createBlobContentReference(
  encryptedContent: Uint8Array,
): Promise<BlobContentReference> {
  const cid = await ipfsOnlyHash(encryptedContent, CID_IMPORT_POLICY);
  const cidString = cid.toString();

  return {
    cid: cidString,
    uri: `${IPFS_URI_PREFIX}${cidString}`,
    size: encryptedContent.byteLength,
  };
}

export async function resolveCredentialEncryptedContent(
  credential: BlobBackedCredentialContent,
  blobGateway?: BlobGateway,
): Promise<Uint8Array> {
  if (credential.content_uri) {
    if (!blobGateway) {
      throw new Error(
        `Credential with id ${credential.id} is blob-backed, but blobGatewayUrl was not configured`,
      );
    }

    return blobGateway.fetchBlob({
      credentialId: credential.id,
      contentUri: credential.content_uri,
      expectedSize: normalizeByteCount(credential.content_size, "content_size"),
    });
  }

  if (credential.content) {
    return base64Decode(credential.content);
  }

  throw new Error(`Credential with id ${credential.id} has no content or content_uri`);
}

export class BlobGateway {
  readonly #url: string;
  readonly #fetch: typeof fetch;
  readonly #maxFetchBytes: number;
  readonly #accessToken?: string;

  constructor({
    url,
    fetchFn = fetch,
    maxFetchBytes = DEFAULT_BLOB_GATEWAY_MAX_FETCH_BYTES,
    accessToken,
  }: BlobGatewayParams) {
    this.#url = url.replace(/\/$/, "");
    // Native `fetch` must not be stored unbound — calling it as this.#fetch() throws in browsers.
    this.#fetch = (input, init) => fetchFn(input, init);
    this.#maxFetchBytes = normalizeByteCount(maxFetchBytes, "maxFetchBytes") ?? maxFetchBytes;
    this.#accessToken = accessToken?.trim() || undefined;
  }

  get url(): string {
    return this.#url;
  }

  get hasAccessToken(): boolean {
    return this.#accessToken !== undefined;
  }

  /**
   * Clone this gateway with a different UKYC access token, keeping URL, fetch behavior and
   * size limits. Cloning instead of mutating keeps a gateway shared by another session or
   * client state free of this token.
   */
  withAccessToken(accessToken?: string): BlobGateway {
    return new BlobGateway({
      url: this.#url,
      fetchFn: this.#fetch,
      maxFetchBytes: this.#maxFetchBytes,
      accessToken,
    });
  }

  async uploadCredentialBlobs({
    requestId,
    original,
    copy,
  }: UploadCredentialBlobsParams): Promise<BlobGatewayUploadResponse> {
    const uploadUrl = `${this.#url}/blob/v1/requests/${encodeURIComponent(requestId)}/upload`;
    const body = new FormData();
    if (original) {
      body.append("original", new Blob([toArrayBuffer(original)]), "original.blob");
    }
    if (copy) {
      body.append("copy", new Blob([toArrayBuffer(copy)]), "copy.blob");
    }

    // Hash while the upload is in flight so we can fail fast if the gateway
    // reports a different CID than the bytes we sent.
    const expectedOriginalCid = original
      ? createBlobContentReference(original).then((reference) => reference.cid)
      : undefined;
    const expectedCopyCid = copy
      ? createBlobContentReference(copy).then((reference) => reference.cid)
      : undefined;

    const response = await this.#fetch(uploadUrl, this.#withAccessToken({ method: "POST", body }));

    if (!response.ok) {
      throw await readBlobGatewayHttpError(response, "upload");
    }

    const responseText = await response.text();
    const parsed = JSON.parse(responseText) as BlobGatewayUploadResponse;
    const [originalCid, copyCid] = await Promise.all([expectedOriginalCid, expectedCopyCid]);

    assertReturnedUploadCid(parsed.original_cid, originalCid, "original");
    assertReturnedUploadCid(parsed.copy_cid, copyCid, "copy");

    return parsed;
  }

  async fetchBlob({
    credentialId,
    contentUri,
    expectedSize,
    maxBytes,
  }: FetchBlobParams): Promise<Uint8Array> {
    const expectedByteLength = normalizeByteCount(expectedSize, "expectedSize");
    const explicitMaxBytes = normalizeByteCount(maxBytes, "maxBytes");
    const maxFetchBytes = explicitMaxBytes ?? this.#maxFetchBytes;

    if (expectedByteLength !== undefined && expectedByteLength > maxFetchBytes) {
      throw new Error(
        `blob gateway expected size ${expectedByteLength} exceeds maximum fetch size ${maxFetchBytes}`,
      );
    }

    const maxResponseBytes = expectedByteLength ?? maxFetchBytes;
    const fetchUrl = this.#credentialUrl(credentialId);

    const response = await this.#fetch(fetchUrl, this.#withAccessToken());
    const contentLength = response.headers.get("content-length");
    const declaredContentLength = parseContentLength(contentLength);

    if (!response.ok) {
      throw await readBlobGatewayHttpError(response, "fetch");
    }

    if (declaredContentLength !== undefined && declaredContentLength > maxResponseBytes) {
      if (response.body) {
        await response.body.cancel().catch(() => undefined);
      }
      throw new Error(
        `blob gateway response content-length ${declaredContentLength} exceeds maximum fetch size ${maxResponseBytes}`,
      );
    }

    const content = await readResponseBytes(response, maxResponseBytes);

    if (expectedByteLength !== undefined && content.byteLength !== expectedByteLength) {
      throw new Error(
        `blob gateway returned ${content.byteLength} bytes, expected ${expectedByteLength}`,
      );
    }

    if (isIpfsContentUri(contentUri)) {
      const cid = rootCidFromContentUri(contentUri);
      const contentCid = await ipfsOnlyHash(content, CID_IMPORT_POLICY);

      if (contentCid.toString() !== cid) {
        throw new Error(
          `blob gateway returned content with CID ${contentCid.toString()}, expected ${cid}`,
        );
      }
    }

    return content;
  }

  async deleteCredentialBlob({ credentialId }: DeleteCredentialBlobParams): Promise<void> {
    const response = await this.#fetch(
      this.#credentialUrl(credentialId),
      this.#withAccessToken({ method: "DELETE" }),
    );

    if (!response.ok) {
      throw await readBlobGatewayHttpError(response, "delete");
    }
  }

  #credentialUrl(credentialId: string): string {
    return `${this.#url}/blob/v1/credentials/${encodeURIComponent(credentialId)}`;
  }

  #withAccessToken(init?: RequestInit): RequestInit | undefined {
    if (!this.#accessToken) {
      return init;
    }

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `AccessToken ${this.#accessToken}`);
    return { ...init, headers };
  }
}

async function readBlobGatewayHttpError(
  response: Response,
  operation: BlobGatewayOperation,
): Promise<BlobGatewayHttpError> {
  let responseText = "";
  try {
    responseText = new TextDecoder().decode(
      await readResponseBytes(response, MAX_BLOB_GATEWAY_ERROR_BYTES),
    );
  } catch {
    // Opaque or oversized intermediary responses must not leak into application logs.
  }
  return blobGatewayHttpError(response, operation, responseText);
}

function blobGatewayHttpError(
  response: Response,
  operation: BlobGatewayOperation,
  responseText: string,
): BlobGatewayHttpError {
  let parsed: { code?: unknown; error?: unknown } = {};
  if (response.headers.get("content-type")?.toLowerCase().includes("json")) {
    try {
      parsed = JSON.parse(responseText) as { code?: unknown; error?: unknown };
    } catch {
      // Malformed error responses are represented by status and request ID only.
    }
  }
  const code = typeof parsed.code === "string" ? parsed.code : "BLOB_GATEWAY_HTTP_ERROR";
  const candidate = typeof parsed.error === "string" ? parsed.error.trim() : "";
  const detail =
    candidate && !/<(?:!doctype|html|body|script)\b/i.test(candidate)
      ? candidate.replace(/\s+/g, " ").slice(0, 200)
      : undefined;
  return new BlobGatewayHttpError(
    operation,
    response.status,
    code,
    response.headers.get("x-request-id") ?? undefined,
    detail,
  );
}

function rootCidFromContentUri(contentUri: string): string {
  if (!contentUri.startsWith(IPFS_URI_PREFIX)) {
    throw new Error(`content_uri must start with ${IPFS_URI_PREFIX}`);
  }

  return contentUri.slice(IPFS_URI_PREFIX.length);
}

function assertReturnedUploadCid(
  returnedCid: string | undefined,
  expectedCid: string | undefined,
  label: "original" | "copy",
): void {
  // Gateway may omit CIDs; when it reports one for a part we uploaded, it must match.
  if (expectedCid === undefined || returnedCid === undefined) {
    return;
  }

  if (returnedCid !== expectedCid) {
    throw new Error(
      `blob gateway upload returned ${label} CID ${returnedCid}, expected ${expectedCid}`,
    );
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function normalizeByteCount(value: unknown, label: string): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    throw new Error(`${label} must be a non-negative safe integer`);
  }

  const size =
    typeof value === "bigint" ? Number(value) : typeof value === "string" ? Number(value) : value;

  if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0) {
    throw new Error(`${label} must be a non-negative safe integer`);
  }

  return size;
}

function parseContentLength(contentLength: string | null): number | undefined {
  if (contentLength === null) {
    return undefined;
  }

  const size = Number(contentLength);

  if (!Number.isSafeInteger(size) || size < 0) {
    return undefined;
  }

  return size;
}

async function readResponseBytes(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (response.body === null) {
    return new Uint8Array();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      receivedBytes += value.byteLength;

      if (receivedBytes > maxBytes) {
        await reader.cancel();
        throw new Error(`blob gateway fetch exceeded maximum size of ${maxBytes} bytes`);
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const content = new Uint8Array(receivedBytes);
  let offset = 0;

  for (const chunk of chunks) {
    content.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return content;
}
