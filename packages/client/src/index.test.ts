// @vitest-environment node

import type { BaseProvider } from "@idos-network/enclave";

import { createMmTokenAuth, type KwilActionClient } from "@idos-network/kwil-infra";
import { BlobGateway } from "@idos-network/utils/blob-gateway";
import { base64UrlEncode, utf8Encode } from "@idos-network/utils/codecs";
import { MemoryStore } from "@idos-network/utils/store";
import { describe, expect, it } from "vitest";

import { idOSClientIdle } from "./index.js";

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
