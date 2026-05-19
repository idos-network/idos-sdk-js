import { of as ipfsOnlyHash } from "ipfs-only-hash";

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
};

export type UploadCredentialBlobsParams = {
  requestId: string;
  original: Uint8Array;
  copy: Uint8Array;
};

export type FetchBlobParams = {
  contentUri: string;
};

const IPFS_URI_PREFIX = "ipfs://";

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

export class BlobGateway {
  readonly #url: string;
  readonly #fetch: typeof fetch;

  constructor({ url, fetchFn = fetch }: BlobGatewayParams) {
    this.#url = url.replace(/\/$/, "");
    this.#fetch = fetchFn;
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

  async fetchBlob({ contentUri }: FetchBlobParams): Promise<Uint8Array> {
    const cid = rootCidFromContentUri(contentUri);
    const fetchUrl = `${this.#url}/blob/v1/ipfs/${encodeURIComponent(cid)}`;
    const startedAt = Date.now();

    console.log("blob-gateway fetch request");
    console.log(
      JSON.stringify(
        {
          cid,
          content_uri: contentUri,
          url: fetchUrl,
        },
        null,
        2,
      ),
    );

    const response = await this.#fetch(fetchUrl);
    const contentLength = response.headers.get("content-length");

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

    const content = new Uint8Array(await response.arrayBuffer());
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
