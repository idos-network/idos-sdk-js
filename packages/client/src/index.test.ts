// @vitest-environment node

import type { BaseProvider } from "@idos-network/enclave";

import { createMmTokenAuth, type KwilActionClient } from "@idos-network/kwil-infra";
import { BlobGateway, createBlobContentReference } from "@idos-network/utils/blob-gateway";
import { base64Encode, base64UrlEncode, utf8Encode } from "@idos-network/utils/codecs";
import { MemoryStore } from "@idos-network/utils/store";
import { describe, expect, it } from "vitest";

import { idOSClientIdle, idOSClientLoggedIn, type idOSClientWithUserSigner } from "./index.js";

const mmToken = base64UrlEncode(
  utf8Encode(
    JSON.stringify({
      payload: {
        signing_public_key: base64UrlEncode(new Uint8Array(32).fill(7)),
        storage_id: "storage-abc",
      },
      signature: base64UrlEncode(new Uint8Array(64).fill(9)),
    }),
  ),
);

function idleClient(): idOSClientIdle {
  const kwilClient = {
    setSigner: () => {},
    client: { auth: { logoutKGW: async () => {} } },
  } as unknown as KwilActionClient;
  const enclaveProvider = { setSigner: () => {} } as unknown as BaseProvider;

  return new idOSClientIdle(
    new MemoryStore(),
    kwilClient,
    enclaveProvider,
    new BlobGateway({ url: "https://blob.example" }),
  );
}

describe("UKYC blob authorization is scoped to the signed session", () => {
  it("binds the MM capability when the signer is selected", async () => {
    const idle = idleClient();

    const withSigner = await idle.withUserSigner(createMmTokenAuth(mmToken));

    expect(withSigner.blobGateway.hasAccessToken).toBe(true);
    expect(idle.blobGateway.hasAccessToken).toBe(false);
  });

  it("drops the MM capability on logout", async () => {
    const withSigner = await idleClient().withUserSigner(createMmTokenAuth(mmToken));

    expect((await withSigner.logOut()).blobGateway.hasAccessToken).toBe(false);
  });

  it("leaves a non-MM session without UKYC authorization", async () => {
    const idle = idleClient();
    const customSigner = {
      publicAddress: "0x1234567890123456789012345678901234567890",
      publicKey: base64UrlEncode(new Uint8Array(32).fill(3)),
      signatureType: "ed25519",
      walletType: "EVM",
      signMessage: async () => new Uint8Array(64),
    };

    const withSigner = await idle.withUserSigner(customSigner as never);

    expect(withSigner.blobGateway.hasAccessToken).toBe(false);
  });
});

describe("credential blob storage", () => {
  it.each(["MM", "EVM"] as const)(
    "creates %s credentials through the IPFS CID-validation flow",
    async (walletType) => {
      const plaintext = utf8Encode("private credential content");
      let preliminaryInput: Record<string, unknown> | undefined;
      let uploadedBytes: Uint8Array | undefined;
      const kwilClient = {
        execute: async ({ inputs }: { inputs: Record<string, unknown> }) => {
          preliminaryInput = inputs;
        },
      } as unknown as KwilActionClient;
      const blobGateway = new BlobGateway({
        url: "https://blob.example",
        accessToken: walletType === "MM" ? mmToken : undefined,
        fetchFn: async (_input, init) => {
          const body = init?.body;
          if (!(body instanceof FormData)) throw new Error("Expected multipart upload");
          const original = body.get("original");
          if (!(original instanceof Blob)) throw new Error("Expected original blob");

          uploadedBytes = new Uint8Array(await original.arrayBuffer());
          const { cid } = await createBlobContentReference(uploadedBytes);
          return Response.json({
            request_id: preliminaryInput?.request_id,
            original_cid: cid,
          });
        },
      });
      const withSigner = {
        store: new MemoryStore(),
        kwilClient,
        enclaveProvider: {},
        signer: {},
        kwilSigner: {},
        walletIdentifier: "wallet",
        walletPublicKey: undefined,
        walletType,
        blobGateway,
      } as unknown as idOSClientWithUserSigner;
      const client = new idOSClientLoggedIn(withSigner, {
        id: crypto.randomUUID(),
        recipient_encryption_public_key: base64Encode(new Uint8Array(32).fill(7)),
        encryption_password_store: "user",
      });

      const credential = await client.createCredential("public notes", plaintext);

      expect(credential.content_uri).toMatch(/^ipfs:\/\//);
      expect(preliminaryInput?.content_uri).toBe(credential.content_uri);
      expect(preliminaryInput?.content_size).toBe(plaintext.byteLength + 40);
      expect(uploadedBytes?.byteLength).toBe(preliminaryInput?.content_size);
    },
  );
});
