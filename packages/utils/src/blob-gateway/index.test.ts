// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { base64Encode, utf8Encode } from "../codecs";
import {
  BlobGateway,
  createBlobContentReference,
  createUkycContentUri,
  requireAccessTokenForUkycContent,
  resolveCredentialEncryptedContent,
} from "./index.js";

describe("requireAccessTokenForUkycContent", () => {
  it("allows ipfs and inline deletes without an accessToken", () => {
    expect(() => requireAccessTokenForUkycContent("ipfs://cid", false)).not.toThrow();
    expect(() => requireAccessTokenForUkycContent(null, false)).not.toThrow();
  });

  it("rejects ukyc deletes when no accessToken was configured", () => {
    expect(() => requireAccessTokenForUkycContent("ukyc://object-1", false)).toThrow(
      /requires an accessToken/,
    );
  });
});

describe("createUkycContentUri", () => {
  it("builds storage_id/blobs/blob_id", () => {
    expect(createUkycContentUri("storage-abc", "blob-1")).toBe("ukyc://storage-abc/blobs/blob-1");
  });

  it("rejects a storage_id with path segments", () => {
    expect(() => createUkycContentUri("storage-abc/extra", "blob-1")).toThrow(/storage_id/);
  });
});

describe("createBlobContentReference", () => {
  it("creates a blob-gateway compatible content reference", async () => {
    const result = await createBlobContentReference(utf8Encode("hi"));

    expect(result).toEqual({
      cid: "bafkreiepinbumzepnoln7co5vea4kf3lcctnqolb3u6bvsellgznymt2uq",
      uri: "ipfs://bafkreiepinbumzepnoln7co5vea4kf3lcctnqolb3u6bvsellgznymt2uq",
      size: 2,
    });
  });
});

describe("resolveCredentialEncryptedContent", () => {
  it("returns inline credential content bytes", async () => {
    const content = utf8Encode("inline content");

    await expect(
      resolveCredentialEncryptedContent({
        id: "credential-1",
        content: base64Encode(content),
      }),
    ).resolves.toEqual(content);
  });

  it("fetches blob-backed content with normalized content_size", async () => {
    const content = utf8Encode("blob content");
    const { size, uri } = await createBlobContentReference(content);
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () => new Response(content),
    });

    await expect(
      resolveCredentialEncryptedContent(
        {
          id: "credential-1",
          content: null,
          content_uri: uri,
          content_size: String(size),
        },
        gateway,
      ),
    ).resolves.toEqual(content);
  });

  it("prefers CID-verified blob content over inline credential content", async () => {
    const inlineContent = utf8Encode("inline content");
    const blobContent = utf8Encode("blob content");
    const { size, uri } = await createBlobContentReference(blobContent);
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () => new Response(blobContent),
    });

    await expect(
      resolveCredentialEncryptedContent(
        {
          id: "credential-1",
          content: base64Encode(inlineContent),
          content_uri: uri,
          content_size: size,
        },
        gateway,
      ),
    ).resolves.toEqual(blobContent);
  });
});

describe("BlobGateway", () => {
  it("uploads credential blobs through the initialized gateway URL", async () => {
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example/",
      fetchFn: async (...args) => {
        calls.push(args);
        return Response.json({ request_id: "request-1", quorum: 1 });
      },
    });

    const result = await gateway.uploadCredentialBlobs({
      requestId: "request-1",
      original: utf8Encode("original"),
      copy: utf8Encode("copy"),
    });

    expect(result).toEqual({ request_id: "request-1", quorum: 1 });
    expect(calls[0]?.[0]).toBe("https://blob.example/blob/v1/requests/request-1/upload");
    expect(calls[0]?.[1]?.method).toBe("POST");
    expect(calls[0]?.[1]?.body).toBeInstanceOf(FormData);
  });

  it("sends AccessToken on upload when configured at construct time", async () => {
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example",
      accessToken: "mm-envelope",
      fetchFn: async (...args) => {
        calls.push(args);
        return Response.json({ request_id: "request-1" });
      },
    });

    await gateway.uploadCredentialBlobs({
      requestId: "request-1",
      original: utf8Encode("original"),
    });

    expect(new Headers(calls[0]?.[1]?.headers).get("Authorization")).toBe(
      "AccessToken mm-envelope",
    );
  });

  it("uploads a copy blob without requiring an original blob", async () => {
    const copy = utf8Encode("copy");
    const { cid } = await createBlobContentReference(copy);
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async (...args) => {
        calls.push(args);
        return Response.json({ request_id: "request-1", copy_cid: cid });
      },
    });

    const result = await gateway.uploadCredentialBlobs({
      requestId: "request-1",
      copy,
    });

    expect(result).toEqual({ request_id: "request-1", copy_cid: cid });
    expect(calls[0]?.[1]?.body).toBeInstanceOf(FormData);
  });

  it("rejects upload responses whose CID does not match the uploaded bytes", async () => {
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () =>
        Response.json({
          request_id: "request-1",
          original_cid: "bafkreiwrongcidfromgateway000000000000000000000000000000",
        }),
    });

    await expect(
      gateway.uploadCredentialBlobs({
        requestId: "request-1",
        original: utf8Encode("original"),
      }),
    ).rejects.toThrow(/blob gateway upload returned original CID .+, expected .+/);
  });

  it("fetches blobs through the initialized gateway URL", async () => {
    const content = utf8Encode("content");
    const { size, uri } = await createBlobContentReference(content);
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async (...args) => {
        calls.push(args);
        return new Response(content);
      },
    });

    const result = await gateway.fetchBlob({
      credentialId: "credential-1",
      contentUri: uri,
      expectedSize: size,
    });

    expect(result).toEqual(content);
    expect(calls[0]?.[0]).toBe("https://blob.example/blob/v1/credentials/credential-1");
    expect(calls[0]?.[1]?.headers).toBeUndefined();
  });

  it("rejects fetched blobs whose bytes do not match the content URI CID", async () => {
    const { uri } = await createBlobContentReference(utf8Encode("expected"));
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () => new Response(utf8Encode("tampered")),
    });

    await expect(
      gateway.fetchBlob({ credentialId: "credential-1", contentUri: uri }),
    ).rejects.toThrow(/blob gateway returned content with CID .+, expected .+/);
  });

  it("rejects fetched blobs larger than the expected size while reading", async () => {
    const content = utf8Encode("content");
    const { uri } = await createBlobContentReference(content);
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () => new Response(content),
    });

    await expect(
      gateway.fetchBlob({
        credentialId: "credential-1",
        contentUri: uri,
        expectedSize: content.byteLength - 1,
      }),
    ).rejects.toThrow("blob gateway fetch exceeded maximum size of 6 bytes");
  });

  it("rejects content-length values larger than the configured fetch maximum", async () => {
    const content = utf8Encode("content");
    const { uri } = await createBlobContentReference(content);
    const response = new Response(content, {
      headers: { "content-length": String(content.byteLength) },
    });
    const cancel = vi.spyOn(response.body!, "cancel");
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () => response,
    });

    await expect(
      gateway.fetchBlob({ credentialId: "credential-1", contentUri: uri, maxBytes: 6 }),
    ).rejects.toThrow("blob gateway response content-length 7 exceeds maximum fetch size 6");
    expect(cancel).toHaveBeenCalled();
  });

  it("rejects expectedSize that exceeds the configured gateway fetch maximum", async () => {
    const content = utf8Encode("content");
    const { uri } = await createBlobContentReference(content);
    const gateway = new BlobGateway({
      url: "https://blob.example",
      maxFetchBytes: 4,
      fetchFn: async () => new Response(content),
    });

    await expect(
      gateway.fetchBlob({
        credentialId: "credential-1",
        contentUri: uri,
        expectedSize: content.byteLength,
      }),
    ).rejects.toThrow("blob gateway expected size 7 exceeds maximum fetch size 4");
  });

  it("skips CID checks for ukyc:// blobs and only verifies size", async () => {
    const content = utf8Encode("ukyc-bytes");
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () => new Response(content),
    });

    await expect(
      gateway.fetchBlob({
        credentialId: "credential-1",
        contentUri: "ukyc://object-1",
        expectedSize: content.byteLength,
      }),
    ).resolves.toEqual(content);
  });

  it("sends AccessToken on fetch when configured at construct time", async () => {
    const content = utf8Encode("content");
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example",
      accessToken: "mm-envelope",
      fetchFn: async (...args) => {
        calls.push(args);
        return new Response(content);
      },
    });

    await gateway.fetchBlob({ credentialId: "credential-1", contentUri: "ukyc://object-1" });

    expect(new Headers(calls[0]?.[1]?.headers).get("Authorization")).toBe(
      "AccessToken mm-envelope",
    );
  });

  it("deletes credential blobs by id and treats 204 as success", async () => {
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async (...args) => {
        calls.push(args);
        return new Response(null, { status: 204 });
      },
    });

    await expect(
      gateway.deleteCredentialBlob({ credentialId: "credential-1" }),
    ).resolves.toBeUndefined();
    expect(calls[0]?.[0]).toBe("https://blob.example/blob/v1/credentials/credential-1");
    expect(calls[0]?.[1]?.method).toBe("DELETE");
  });

  it("clones with a new access token without mutating the source gateway", async () => {
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example/",
      maxFetchBytes: 1024,
      fetchFn: async (...args) => {
        calls.push(args);
        return new Response(null, { status: 204 });
      },
    });

    const authorized = gateway.withAccessToken("mm-envelope");
    expect(gateway.hasAccessToken).toBe(false);
    expect(authorized.hasAccessToken).toBe(true);
    expect(authorized.withAccessToken().hasAccessToken).toBe(false);

    await authorized.deleteCredentialBlob({ credentialId: "credential-1" });
    await gateway.deleteCredentialBlob({ credentialId: "credential-1" });

    expect(calls[0]?.[0]).toBe("https://blob.example/blob/v1/credentials/credential-1");
    expect(new Headers(calls[0]?.[1]?.headers).get("Authorization")).toBe(
      "AccessToken mm-envelope",
    );
    expect(new Headers(calls[1]?.[1]?.headers).get("Authorization")).toBeNull();
  });

  it("sends AccessToken on delete when configured at construct time", async () => {
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example",
      accessToken: "mm-envelope",
      fetchFn: async (...args) => {
        calls.push(args);
        return new Response(null, { status: 204 });
      },
    });

    await gateway.deleteCredentialBlob({ credentialId: "credential-1" });

    expect(new Headers(calls[0]?.[1]?.headers).get("Authorization")).toBe(
      "AccessToken mm-envelope",
    );
  });
});
