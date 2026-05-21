// @vitest-environment node

import { describe, expect, it } from "vitest";

import { BlobGateway, createBlobContentReference, resolveCredentialEncryptedContent } from ".";
import { base64Encode, utf8Encode } from "../codecs";

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

  it("uploads a copy blob without requiring an original blob", async () => {
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async (...args) => {
        calls.push(args);
        return Response.json({ request_id: "request-1", copy_cid: "copy-cid" });
      },
    });

    const result = await gateway.uploadCredentialBlobs({
      requestId: "request-1",
      copy: utf8Encode("copy"),
    });

    expect(result).toEqual({ request_id: "request-1", copy_cid: "copy-cid" });
    expect(calls[0]?.[1]?.body).toBeInstanceOf(FormData);
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

    const result = await gateway.fetchBlob({ contentUri: uri, expectedSize: size });

    expect(result).toEqual(content);
    expect(calls[0]?.[0]).toBe(
      `https://blob.example/blob/v1/ipfs/${encodeURIComponent(uri.slice("ipfs://".length))}`,
    );
  });

  it("rejects fetched blobs whose bytes do not match the content URI CID", async () => {
    const { uri } = await createBlobContentReference(utf8Encode("expected"));
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () => new Response(utf8Encode("tampered")),
    });

    await expect(gateway.fetchBlob({ contentUri: uri })).rejects.toThrow(
      /blob gateway returned content with CID .+, expected .+/,
    );
  });

  it("rejects fetched blobs larger than the expected size while reading", async () => {
    const content = utf8Encode("content");
    const { uri } = await createBlobContentReference(content);
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () => new Response(content),
    });

    await expect(
      gateway.fetchBlob({ contentUri: uri, expectedSize: content.byteLength - 1 }),
    ).rejects.toThrow("blob gateway fetch exceeded maximum size of 6 bytes");
  });

  it("rejects content-length values larger than the configured fetch maximum", async () => {
    const content = utf8Encode("content");
    const { uri } = await createBlobContentReference(content);
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async () =>
        new Response(content, {
          headers: { "content-length": String(content.byteLength) },
        }),
    });

    await expect(gateway.fetchBlob({ contentUri: uri, maxBytes: 6 })).rejects.toThrow(
      "blob gateway response content-length 7 exceeds maximum fetch size 6",
    );
  });
});
