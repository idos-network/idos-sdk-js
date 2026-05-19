// @vitest-environment node

import { describe, expect, it } from "vitest";

import { BlobGateway, createBlobContentReference } from ".";
import { utf8Encode } from "../codecs";

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

  it("fetches blobs through the initialized gateway URL", async () => {
    const content = utf8Encode("content");
    const { uri } = await createBlobContentReference(content);
    const calls: Parameters<typeof fetch>[] = [];
    const gateway = new BlobGateway({
      url: "https://blob.example",
      fetchFn: async (...args) => {
        calls.push(args);
        return new Response(content);
      },
    });

    const result = await gateway.fetchBlob({ contentUri: uri });

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
});
