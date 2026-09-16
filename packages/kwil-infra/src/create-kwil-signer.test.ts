import { base64UrlEncode, utf8Encode } from "@idos-network/utils/codecs";
import { MemoryStore } from "@idos-network/utils/store";
import { describe, expect, it, vi } from "vitest";

import type { KwilActionClient } from "./create-kwil-client";

import { createClientKwilSigner, createServerKwilSigner } from "./create-kwil-signer";
import { createMmTokenAuth } from "./mm-token/create-mm-token-kwil-signer";

function mmToken(signingKeyByte: number): string {
  return base64UrlEncode(
    utf8Encode(
      JSON.stringify({
        payload: {
          signing_public_key: base64UrlEncode(new Uint8Array(32).fill(signingKeyByte)),
          storage_id: "storage-abc",
        },
        signature: base64UrlEncode(new Uint8Array(64).fill(9)),
      }),
    ),
  );
}

function kwilClientWithLogout(logoutKGW: () => Promise<void>): KwilActionClient {
  return { client: { auth: { logoutKGW } } } as unknown as KwilActionClient;
}

describe("createClientKwilSigner with MM authentication", () => {
  it("reports the MM signing identity as address and public key", async () => {
    const auth = createMmTokenAuth(mmToken(7));
    const logoutKGW = vi.fn(async () => {});

    const [signer, address, publicKey, walletType] = await createClientKwilSigner(
      new MemoryStore(),
      kwilClientWithLogout(logoutKGW),
      auth,
    );

    expect(signer).toBe(auth);
    expect(walletType).toBe("MM");
    expect(address).toBe(base64UrlEncode(auth.identifier));
    expect(publicKey).toBe(address);
  });

  it("clears the KGW session only when the MM signing identity changes", async () => {
    const store = new MemoryStore();
    const logoutKGW = vi.fn(async () => {});
    const kwilClient = kwilClientWithLogout(logoutKGW);

    await createClientKwilSigner(store, kwilClient, createMmTokenAuth(mmToken(7)));
    expect(logoutKGW).toHaveBeenCalledTimes(1);

    // Same identity, freshly issued token: the existing KGW cookie stays valid.
    await createClientKwilSigner(store, kwilClient, createMmTokenAuth(mmToken(7)));
    expect(logoutKGW).toHaveBeenCalledTimes(1);

    await createClientKwilSigner(store, kwilClient, createMmTokenAuth(mmToken(8)));
    expect(logoutKGW).toHaveBeenCalledTimes(2);
  });
});

describe("createServerKwilSigner with MM authentication", () => {
  it("uses the MM authentication object as the Kwil signer", async () => {
    const auth = createMmTokenAuth(mmToken(7));

    expect(await createServerKwilSigner(auth)).toEqual([auth, base64UrlEncode(auth.identifier)]);
  });
});
