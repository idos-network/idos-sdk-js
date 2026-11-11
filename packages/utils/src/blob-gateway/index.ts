import { BlackHoleBlockstore } from "blockstore-core/black-hole";
import { importer } from "ipfs-unixfs-importer";
import { fixedSize } from "ipfs-unixfs-importer/chunker";

import { base64Decode, base64UrlDecode, hexEncodeSha256Hash, utf8Decode } from "../codecs";

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
  /**
   * UKYC storage token of an MM user. Sent as `Authorization: AccessToken …` on blob requests,
   * next to whatever session `fetchFn` adds (the MM operator's KGW cookie).
   */
  accessToken?: string;
  /** Extra upload attempts after a network error or a transient gateway status. Defaults to 2. */
  uploadRetries?: number;
  /** Delay before the first upload retry, doubled for each further retry. Defaults to 1000 ms. */
  uploadRetryDelayMs?: number;
  /** Time limit for each upload attempt, response body included. Defaults to 150 000 ms. */
  uploadTimeoutMs?: number;
};

type CredentialBlobParts =
  | { original: Uint8Array; copy: Uint8Array }
  | { original: Uint8Array; copy?: undefined }
  | { original?: undefined; copy: Uint8Array };

export type UploadCredentialBlobsParams = {
  requestId: string;
  /** Ids of the credentials this upload finalizes, reported on `BlobGatewayUploadOutcomeUnknownError`. */
  credentialIds?: string[];
} & CredentialBlobParts;

export type FetchBlobParams = {
  credentialId: string;
  contentUri?: string | null;
  expectedSize?: number | string | bigint | null;
  maxBytes?: number;
  /** Aborts the request and the body read. */
  signal?: AbortSignal;
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
const DEFAULT_UPLOAD_RETRIES = 2;
const DEFAULT_UPLOAD_RETRY_DELAY_MS = 1_000;
// The gateway can spend up to ~120 s pinning and another ~120 s waiting for the Kwil commit,
// so a timeout here can cut off a slow upload that would have succeeded; the retry then
// reports BlobGatewayUploadOutcomeUnknownError instead of hanging.
const DEFAULT_UPLOAD_TIMEOUT_MS = 150_000;
// The preliminary credential stays uploadable until the gateway's stale sweep removes it
// (STALE_PRELIM_AGE_SECONDS, 10 minutes by default). The default attempts, timeouts and
// delays add up to about 7.5 minutes, inside that window.
const RETRYABLE_UPLOAD_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

type BlobGatewayOperation = "upload" | "fetch" | "delete" | "delete-storage";

/**
 * Error codes blob-gateway returns on the MM operator (`ukyc://`) routes. `BlobGatewayHttpError.code`
 * carries them; other routes return further codes, and `BLOB_GATEWAY_HTTP_ERROR` means the
 * response had none.
 */
export const BLOB_GATEWAY_MM_ERROR_CODES = [
  // KGW session missing or expired (the KGW-authenticated fetch re-logs in once on these).
  "UPLOAD_UNAUTHORIZED",
  "READ_UNAUTHORIZED",
  "WIPE_UNAUTHORIZED",
  // The operator does not manage the user, or the token belongs to another user.
  "UPLOAD_FORBIDDEN",
  "READ_FORBIDDEN",
  "WIPE_FORBIDDEN",
  "MM_TOKEN_STORAGE_MISMATCH",
  // 409 on DELETE /blob/v1/storage: the delete token's storage is not the one holding the
  // user's credentials. Nothing was deleted; a delete token for the user's storage is needed.
  "WIPE_STORAGE_MISMATCH",
  // Storage token problems: ask the user's app for a new token.
  "UKYC_TOKEN_MISSING",
  "MM_TOKEN_INVALID",
  "MM_TOKEN_EXPIRED",
  "MM_TOKEN_OPERATION_REQUIRED",
  // State.
  "PRELIMINARY_CREDENTIAL_NOT_FOUND",
  "CREDENTIAL_NOT_FOUND",
  "USER_WIPE_IN_PROGRESS",
  "WIPE_NOT_REQUESTED",
  "UKYC_SINGLE_DELETE_UNSUPPORTED",
  // UKYC or Kwil failed behind the gateway; retry.
  "UKYC_DELETE_FORBIDDEN",
  "UKYC_DELETE_FAILED",
  "UKYC_REQUEST_TIMEOUT",
  "UKYC_TRANSPORT_ERROR",
  "GATEWAY_WIPE_FAILED",
] as const;

export type BlobGatewayMmErrorCode = (typeof BLOB_GATEWAY_MM_ERROR_CODES)[number];

const MM_TOKEN_ERROR_CODES: ReadonlySet<string> = new Set([
  "UKYC_TOKEN_MISSING",
  "MM_TOKEN_INVALID",
  "MM_TOKEN_EXPIRED",
  "MM_TOKEN_OPERATION_REQUIRED",
  "MM_TOKEN_STORAGE_MISMATCH",
  "WIPE_STORAGE_MISMATCH",
]);

/** True when blob-gateway rejected the UKYC storage token itself (a new token is needed). */
export function isBlobGatewayStorageTokenError(error: unknown): error is BlobGatewayHttpError {
  return error instanceof BlobGatewayHttpError && MM_TOKEN_ERROR_CODES.has(error.code);
}

/** True when blob-gateway refused because the MM user is frozen for a data wipe. */
export function isBlobGatewayUserWipeInProgressError(
  error: unknown,
): error is BlobGatewayHttpError {
  return error instanceof BlobGatewayHttpError && error.code === "USER_WIPE_IN_PROGRESS";
}

function isSecureGatewayOrigin(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    return (
      protocol === "https:" ||
      (protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1"))
    );
  } catch {
    return false;
  }
}

export class BlobGatewayHttpError extends Error {
  constructor(
    public readonly operation: BlobGatewayOperation,
    public readonly status: number,
    /** A `BlobGatewayMmErrorCode` on the MM operator routes. */
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

/**
 * The upload may have finalized the credentials even though it failed: the last attempt
 * failed after possibly reaching the gateway, a retry found the preliminary credential gone
 * (404) or finalized by a concurrent attempt (409), or a successful response was unreadable or
 * reported CIDs that don't match the uploaded bytes.
 * Look up `credentialIds` before creating the credentials again.
 */
export class BlobGatewayUploadOutcomeUnknownError extends Error {
  constructor(
    public readonly uploadRequestId: string,
    public readonly credentialIds: string[],
    cause: unknown,
  ) {
    super(
      `blob gateway upload for request ${uploadRequestId} may have succeeded: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
      { cause },
    );
    this.name = "BlobGatewayUploadOutcomeUnknownError";
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

const CONTENT_ADDRESSED_UKYC_BLOB_ID = /^[0-9a-f]{64}$/;

/**
 * The blob id when it is `sha256(ciphertext)` as lowercase hex.
 * Legacy ids (dev credentials created before content addressing) return undefined.
 */
export function contentAddressedUkycBlobId(uri: string | null | undefined): string | undefined {
  if (!isUkycContentUri(uri)) {
    return undefined;
  }
  const marker = "/blobs/";
  const markerIndex = uri.indexOf(marker);
  if (markerIndex < 0) {
    return undefined;
  }
  const blobId = uri.slice(markerIndex + marker.length);
  if (blobId.includes("/") || blobId.includes("?") || blobId.includes("#")) {
    return undefined;
  }
  // shortcut: dev still has ukyc:// rows whose blob id is the credential UUID, from before blob id was sha256(ciphertext). `: undefined` makes fetchBlob skip the hash compare for those. Delete it once those rows are wiped; a blob id that is not 64 hex should then fail the compare. Keep the compare.
  return CONTENT_ADDRESSED_UKYC_BLOB_ID.test(blobId) ? blobId : undefined;
}

/** `blob_id` is `sha256(ciphertext)`, so the signed URI pins the encrypted bytes. */
export function createUkycContentReference(
  storageId: string,
  encryptedContent: Uint8Array,
): { uri: string; size: number } {
  return {
    uri: createUkycContentUri(storageId, hexEncodeSha256Hash(encryptedContent)),
    size: encryptedContent.byteLength,
  };
}

/** Fields of a UKYC storage token payload the SDK reads. blob-gateway verifies the token. */
export type UkycStorageTokenPayload = {
  storage_id: string;
  signing_public_key: string;
  [key: string]: unknown;
};

const STORAGE_TOKEN_SCHEME_PREFIX = /^(?:AccessToken|Bearer)[ \t\n\v\f\r]+/i;

/**
 * The bare storage token: trimmed, without an optional `AccessToken ` / `Bearer ` prefix
 * (case-insensitive, ASCII whitespace after it), which kwild and blob-gateway also accept.
 */
export function normalizeUkycStorageToken(token: string): string {
  return token.trim().replace(STORAGE_TOKEN_SCHEME_PREFIX, "").trim();
}

/**
 * Decode (not verify) a UKYC storage token: base64url JSON `{ payload, signature }`.
 * Use it to build `ukyc://<storage_id>/…` URIs; blob-gateway and UKYC do the verification.
 */
export function decodeUkycStorageToken(token: string): UkycStorageTokenPayload {
  const trimmed = normalizeUkycStorageToken(token);
  if (!trimmed) {
    throw new Error("Invalid UKYC storage token: empty");
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(utf8Decode(base64UrlDecode(trimmed)));
  } catch (error) {
    throw new Error("Invalid UKYC storage token: expected base64url JSON", { cause: error });
  }

  const payload =
    envelope !== null && typeof envelope === "object" && "payload" in envelope
      ? (envelope as { payload: unknown }).payload
      : undefined;
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid UKYC storage token: missing payload");
  }

  const { storage_id: storageId, signing_public_key: signingPublicKey } = payload as Record<
    string,
    unknown
  >;
  if (typeof storageId !== "string" || !storageId.trim()) {
    throw new Error("Invalid UKYC storage token: payload is missing storage_id");
  }
  if (typeof signingPublicKey !== "string" || !signingPublicKey.trim()) {
    throw new Error("Invalid UKYC storage token: payload is missing signing_public_key");
  }

  return {
    ...(payload as Record<string, unknown>),
    storage_id: storageId.trim(),
    signing_public_key: signingPublicKey.trim(),
  };
}

/**
 * @deprecated Only MM operators reach `ukyc://` blobs now (`idOSMmOperator` in
 * `@idos-network/issuer`). Kept for compatibility; will be removed in the next major.
 */
export function requireAccessTokenForUkycContent(
  contentUri: string | null | undefined,
  hasAccessToken: boolean,
): void {
  if (isUkycContentUri(contentUri) && !hasAccessToken) {
    throw new Error(
      "A ukyc:// credential requires a UKYC storage token; only its MM operator can access it",
    );
  }
}

// Changing any of these changes every CID, so stored blobs would stop verifying.
const CID_IMPORT_POLICY = {
  cidVersion: 1,
  rawLeaves: true,
  chunker: fixedSize({ chunkSize: 262144 }),
  wrapWithDirectory: false,
} as const;

async function ipfsOnlyHash(content: Uint8Array): Promise<string> {
  let cid = "";
  for await (const entry of importer([{ content }], new BlackHoleBlockstore(), CID_IMPORT_POLICY)) {
    cid = entry.cid.toString();
  }
  return cid;
}

export async function createBlobContentReference(
  encryptedContent: Uint8Array,
): Promise<BlobContentReference> {
  const cidString = await ipfsOnlyHash(encryptedContent);

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
  readonly #uploadRetries: number;
  readonly #uploadRetryDelayMs: number;
  readonly #uploadTimeoutMs: number;

  constructor({
    url,
    fetchFn = fetch,
    maxFetchBytes = DEFAULT_BLOB_GATEWAY_MAX_FETCH_BYTES,
    accessToken,
    uploadRetries = DEFAULT_UPLOAD_RETRIES,
    uploadRetryDelayMs = DEFAULT_UPLOAD_RETRY_DELAY_MS,
    uploadTimeoutMs = DEFAULT_UPLOAD_TIMEOUT_MS,
  }: BlobGatewayParams) {
    const normalizedAccessToken =
      (accessToken && normalizeUkycStorageToken(accessToken)) || undefined;
    if (normalizedAccessToken && !isSecureGatewayOrigin(url)) {
      throw new Error(
        "Blob gateway accessToken requires HTTPS, except for HTTP localhost or 127.0.0.1",
      );
    }

    this.#url = url.replace(/\/$/, "");
    // Native `fetch` must not be stored unbound — calling it as this.#fetch() throws in browsers.
    this.#fetch = (input, init) => fetchFn(input, init);
    this.#maxFetchBytes = normalizeByteCount(maxFetchBytes, "maxFetchBytes") ?? maxFetchBytes;
    this.#accessToken = normalizedAccessToken;
    this.#uploadRetries = normalizeByteCount(uploadRetries, "uploadRetries") ?? uploadRetries;
    this.#uploadRetryDelayMs =
      normalizeByteCount(uploadRetryDelayMs, "uploadRetryDelayMs") ?? uploadRetryDelayMs;
    this.#uploadTimeoutMs =
      normalizeByteCount(uploadTimeoutMs, "uploadTimeoutMs") ?? uploadTimeoutMs;
    if (this.#uploadTimeoutMs === 0) {
      throw new Error("uploadTimeoutMs must be positive");
    }
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
      uploadRetries: this.#uploadRetries,
      uploadRetryDelayMs: this.#uploadRetryDelayMs,
      uploadTimeoutMs: this.#uploadTimeoutMs,
    });
  }

  /**
   * Retries network errors, timeouts and transient gateway statuses. Throws
   * `BlobGatewayUploadOutcomeUnknownError` when the credentials may have been finalized anyway,
   * and other errors only when they were not.
   */
  async uploadCredentialBlobs({
    requestId,
    credentialIds = [],
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
    const expectedContentIds = Promise.all([
      original
        ? createBlobContentReference(original).then((reference) => reference.cid)
        : undefined,
      copy ? createBlobContentReference(copy).then((reference) => reference.cid) : undefined,
    ]);
    // A failed attempt must not leave a hashing rejection unhandled.
    expectedContentIds.catch(() => undefined);

    const outcomeUnknown = (cause: unknown) =>
      new BlobGatewayUploadOutcomeUnknownError(requestId, credentialIds, cause);

    let response: Response;
    for (let attempt = 0; ; attempt++) {
      try {
        // The clock also runs while a KGW-authenticated fetch waits for a re-auth signature;
        // the retry then reuses the fresh cookie.
        response = await this.#fetch(
          uploadUrl,
          this.#withAccessToken({
            method: "POST",
            body,
            signal: AbortSignal.timeout(this.#uploadTimeoutMs),
          }),
        );

        if (!response.ok) {
          throw await readBlobGatewayHttpError(response, "upload");
        }
        break;
      } catch (error) {
        if (
          attempt > 0 &&
          error instanceof BlobGatewayHttpError &&
          (error.status === 404 || error.status === 409)
        ) {
          throw outcomeUnknown(error);
        }
        if (!isRetryableUploadError(error)) {
          throw error;
        }
        // Network errors, timeouts and 5xx can happen after the gateway finalized.
        if (attempt >= this.#uploadRetries) {
          throw outcomeUnknown(error);
        }
        await sleep(this.#uploadRetryDelayMs * 2 ** attempt);
      }
    }

    // The gateway answers 2xx only after finalizing, so any failure from here on is reported
    // as an unknown outcome, never as "not created".
    try {
      const parsed = JSON.parse(await response.text()) as BlobGatewayUploadResponse;
      const [originalCid, copyCid] = await expectedContentIds;

      assertReturnedUploadCid(parsed.original_cid, originalCid, "original");
      assertReturnedUploadCid(parsed.copy_cid, copyCid, "copy");

      return parsed;
    } catch (error) {
      throw outcomeUnknown(error);
    }
  }

  async fetchBlob({
    credentialId,
    contentUri,
    expectedSize,
    maxBytes,
    signal,
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

    const response = await this.#fetch(fetchUrl, this.#withAccessToken({ signal }));
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
      const contentCid = await ipfsOnlyHash(content);

      if (contentCid !== cid) {
        throw new Error(`blob gateway returned content with CID ${contentCid}, expected ${cid}`);
      }
    }

    // shortcut: this guard is the skip for that `: undefined` branch (dev UUID blob ids). Delete the guard with it once those rows are wiped. Keep `digest !== ukycBlobId`: that is the read check of the downloaded bytes against the blob id in the URI.
    const ukycBlobId = contentAddressedUkycBlobId(contentUri);
    if (ukycBlobId !== undefined) {
      const digest = hexEncodeSha256Hash(content);
      if (digest !== ukycBlobId) {
        throw new Error(
          `blob gateway returned content with sha256 ${digest}, expected ${ukycBlobId}`,
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

  /**
   * MM user data wipe: `DELETE /blob/v1/storage` with the user's delete token
   * (`withAccessToken(deleteToken)`) and the MM operator's KGW session. Resolves on 204,
   * including when the user is already gone, so it is safe to repeat. The operator must have
   * called `request_user_wipe_as_mm_operator` first (else 409 `WIPE_NOT_REQUESTED`). A delete
   * token for another storage than the user's gets 409 `WIPE_STORAGE_MISMATCH` (nothing deleted).
   * 502 `GATEWAY_WIPE_FAILED` and other 5xx are worth retrying.
   */
  async deleteStorage(): Promise<void> {
    if (!this.#accessToken) {
      throw new Error("deleteStorage requires a UKYC storage token with the delete operation");
    }

    const response = await this.#fetch(
      `${this.#url}/blob/v1/storage`,
      this.#withAccessToken({ method: "DELETE" }),
    );

    if (!response.ok) {
      throw await readBlobGatewayHttpError(response, "delete-storage");
    }
    await response.body?.cancel().catch(() => undefined);
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

function isRetryableUploadError(error: unknown): boolean {
  if (error instanceof BlobGatewayHttpError) {
    return RETRYABLE_UPLOAD_STATUSES.has(error.status);
  }
  // fetch rejects with TypeError on network failures and TimeoutError when the attempt's
  // signal fires. Anything else (wallet signature rejection during KGW re-auth, malformed
  // JSON) would fail the same way again.
  return (
    error instanceof TypeError || (error instanceof DOMException && error.name === "TimeoutError")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
