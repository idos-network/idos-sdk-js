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
};

export type UploadCredentialBlobsParams = {
  requestId: string;
  original: Uint8Array;
  copy: Uint8Array;
};

export type FetchBlobParams = {
  contentUri: string;
  expectedSize?: number | string | bigint | null;
  maxBytes?: number;
};

export type BlobBackedCredentialContent = {
  id: string;
  content?: string | null;
  content_uri?: string | null;
  content_size?: number | string | bigint | null;
};

const IPFS_URI_PREFIX = "ipfs://";
export const DEFAULT_BLOB_GATEWAY_MAX_FETCH_BYTES: number = 32 * 1024 * 1024;

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
  if (credential.content) {
    return base64Decode(credential.content);
  }

  if (!credential.content_uri) {
    throw new Error(`Credential with id ${credential.id} has no content or content_uri`);
  }

  if (!blobGateway) {
    throw new Error(
      `Credential with id ${credential.id} is blob-backed, but blobGatewayUrl was not configured`,
    );
  }

  return blobGateway.fetchBlob({
    contentUri: credential.content_uri,
    expectedSize: normalizeByteCount(credential.content_size, "content_size"),
  });
}

export class BlobGateway {
  readonly #url: string;
  readonly #fetch: typeof fetch;
  readonly #maxFetchBytes: number;

  constructor({
    url,
    fetchFn = fetch,
    maxFetchBytes = DEFAULT_BLOB_GATEWAY_MAX_FETCH_BYTES,
  }: BlobGatewayParams) {
    this.#url = url.replace(/\/$/, "");
    this.#fetch = fetchFn;
    this.#maxFetchBytes = normalizeByteCount(maxFetchBytes, "maxFetchBytes") ?? maxFetchBytes;
  }

  async uploadCredentialBlobs({
    requestId,
    original,
    copy,
  }: UploadCredentialBlobsParams): Promise<BlobGatewayUploadResponse> {
    const uploadUrl = `${this.#url}/blob/v1/requests/${encodeURIComponent(requestId)}/upload`;
    const startedAt = Date.now();

    console.log("blob-gateway upload request");
    console.log(
      JSON.stringify(
        {
          request_id: requestId,
          url: uploadUrl,
          original_size: original.byteLength,
          copy_size: copy.byteLength,
        },
        null,
        2,
      ),
    );

    const body = new FormData();
    body.append("original", new Blob([toArrayBuffer(original)]), "original.blob");
    body.append("copy", new Blob([toArrayBuffer(copy)]), "copy.blob");

    let response: Response;
    try {
      response = await this.#fetch(uploadUrl, {
        method: "POST",
        body,
      });
    } catch (error) {
      console.error("blob-gateway upload request failed before response");
      console.error(
        JSON.stringify(
          {
            request_id: requestId,
            url: uploadUrl,
            elapsed_ms: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error),
            cause:
              error instanceof Error && error.cause
                ? error.cause instanceof Error
                  ? error.cause.message
                  : String(error.cause)
                : undefined,
          },
          null,
          2,
        ),
      );
      throw error;
    }

    const responseText = await response.text();

    console.log("blob-gateway upload response");
    console.log(
      JSON.stringify(
        {
          request_id: requestId,
          url: uploadUrl,
          elapsed_ms: Date.now() - startedAt,
          status: response.status,
          ok: response.ok,
          body: responseText,
        },
        null,
        2,
      ),
    );

    if (!response.ok) {
      throw new Error(`blob gateway upload failed with ${response.status}: ${responseText}`);
    }

    return JSON.parse(responseText) as BlobGatewayUploadResponse;
  }

  async fetchBlob({ contentUri, expectedSize, maxBytes }: FetchBlobParams): Promise<Uint8Array> {
    const cid = rootCidFromContentUri(contentUri);
    const expectedByteLength = normalizeByteCount(expectedSize, "expectedSize");
    const explicitMaxBytes = normalizeByteCount(maxBytes, "maxBytes");
    const maxFetchBytes = explicitMaxBytes ?? this.#maxFetchBytes;

    if (
      expectedByteLength !== undefined &&
      explicitMaxBytes !== undefined &&
      expectedByteLength > explicitMaxBytes
    ) {
      throw new Error(
        `blob gateway expected size ${expectedByteLength} exceeds maximum fetch size ${explicitMaxBytes}`,
      );
    }

    const maxResponseBytes = expectedByteLength ?? maxFetchBytes;
    const fetchUrl = `${this.#url}/blob/v1/ipfs/${encodeURIComponent(cid)}`;
    const startedAt = Date.now();

    console.log("blob-gateway fetch request");
    console.log(
      JSON.stringify(
        {
          cid,
          content_uri: contentUri,
          url: fetchUrl,
          expected_size: expectedByteLength,
          max_response_bytes: maxResponseBytes,
        },
        null,
        2,
      ),
    );

    const response = await this.#fetch(fetchUrl);
    const contentLength = response.headers.get("content-length");
    const declaredContentLength = parseContentLength(contentLength);

    if (!response.ok) {
      const responseText = await response.text();

      console.log("blob-gateway fetch response");
      console.log(
        JSON.stringify(
          {
            cid,
            url: fetchUrl,
            elapsed_ms: Date.now() - startedAt,
            status: response.status,
            ok: response.ok,
            content_length_header: contentLength,
            body: responseText,
          },
          null,
          2,
        ),
      );

      throw new Error(`blob gateway fetch failed with ${response.status}: ${responseText}`);
    }

    if (declaredContentLength !== undefined && declaredContentLength > maxResponseBytes) {
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

    const contentCid = await ipfsOnlyHash(content, CID_IMPORT_POLICY);

    if (contentCid.toString() !== cid) {
      throw new Error(
        `blob gateway returned content with CID ${contentCid.toString()}, expected ${cid}`,
      );
    }

    console.log("blob-gateway fetch response");
    console.log(
      JSON.stringify(
        {
          cid,
          url: fetchUrl,
          elapsed_ms: Date.now() - startedAt,
          status: response.status,
          ok: response.ok,
          content_length_header: contentLength,
          expected_size: expectedByteLength,
          max_response_bytes: maxResponseBytes,
          body_byte_length: content.byteLength,
        },
        null,
        2,
      ),
    );

    return content;
  }
}

function rootCidFromContentUri(contentUri: string): string {
  if (!contentUri.startsWith(IPFS_URI_PREFIX)) {
    throw new Error(`content_uri must start with ${IPFS_URI_PREFIX}`);
  }

  return contentUri.slice(IPFS_URI_PREFIX.length);
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
