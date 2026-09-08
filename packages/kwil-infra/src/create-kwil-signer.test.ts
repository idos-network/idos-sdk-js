<<<<<<< HEAD
import { base64UrlEncode, utf8Encode } from "@idos-network/utils/codecs";
import { MemoryStore } from "@idos-network/utils/store";
=======
import type { Store } from "@idos-network/utils/store";
import type { Wallet as NearWallet } from "@near-wallet-selector/core";
import type { JsonRpcSigner } from "ethers";

import { bs58Encode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";
>>>>>>> 81521f76 (Try to unify and cleanup signers)
import { describe, expect, it, vi } from "vitest";

import type { KwilActionClient } from "./create-kwil-client";

<<<<<<< HEAD
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
=======
import { createNaclKwilSigner } from "./create-kwil-signer.js";
import { createEvmKwilSigner } from "./evm/create-evm-kwil-signer.js";
import { createFaceSignKwilSigner } from "./facesign/facesign-signer.js";
import { createNearWalletKwilSigner } from "./near/create-near-wallet-kwil-signer.js";
import { createXrpKwilSigner } from "./xrp/signer.js";

function createFakeStore(): Store {
  const map = new Map<string, unknown>();
  return {
    get: async (key: string) => map.get(key),
    set: async (key: string, value: unknown) => {
      map.set(key, value);
    },
    delete: async (key: string) => {
      map.delete(key);
    },
    reset: async () => {
      map.clear();
    },
    setRememberDuration: async () => {},
    pipeCodec: () => createFakeStore(),
  } as Store;
}

function createFakeKwilClient(): KwilActionClient {
  return {
    client: { auth: { logoutKGW: vi.fn() } },
  } as unknown as KwilActionClient;
}

describe("createNaclKwilSigner", () => {
  it("signs with ed25519 and derives an implicit address from the public key", async () => {
    const keypair = nacl.sign.keyPair();
    const [kwilSigner, address] = await createNaclKwilSigner(keypair);

    expect(kwilSigner.signatureType).toBe("ed25519");
    expect(kwilSigner.identifier).toEqual(keypair.publicKey);
    expect(address).toMatch(/^[0-9A-Fa-f]+$/);
  });
});

describe("createEvmKwilSigner", () => {
  it("returns an EVM result keyed by the signer's address", async () => {
    const { Wallet } = await import("ethers");
    const wallet = new Wallet("0x1".padEnd(66, "0"));
    const signer = wallet as unknown as JsonRpcSigner;

    const result = await createEvmKwilSigner(signer, createFakeStore(), createFakeKwilClient());

    expect(result.walletType).toBe("EVM");
    expect(result.walletIdentifier).toBe(wallet.address);
    expect(result.walletPublicKey).toBeUndefined();
    expect(result.kwilSigner.identifier).toEqual(
      Uint8Array.from(Buffer.from(wallet.address.slice(2), "hex")),
    );
  });
});

describe("createXrpKwilSigner", () => {
  it("resolves address/public key from a GemWallet-shaped wallet and signs through it", async () => {
    const wallet = {
      isInstalled: async () => ({ result: { isInstalled: true } }),
      getPublicKey: async () => ({ result: { publicKey: "pub123", address: "addr123" } }),
      signMessage: async () => ({ result: { signedMessage: "deadbeef" } }),
    };

    const result = await createXrpKwilSigner(
      wallet as never,
      createFakeStore(),
      createFakeKwilClient(),
    );

    expect(result.walletType).toBe("XRPL");
    expect(result.walletIdentifier).toBe("addr123");
    expect(result.walletPublicKey).toBe("pub123");

    const signature = await (
      result.kwilSigner.signer as (message: string | Uint8Array) => Promise<Uint8Array>
    )("hello");
    expect(signature).toEqual(Buffer.from("deadbeef", "hex"));
  });
});

describe("createFaceSignKwilSigner", () => {
  it("returns a FaceSign result keyed by the provider's public address", async () => {
    const provider = {
      publicAddress: "0xface",
      publicKey: "facekey",
      walletType: "FaceSign",
      signMessage: async () => new Uint8Array([1, 2, 3]),
    };

    const result = await createFaceSignKwilSigner(
      provider as never,
      createFakeStore(),
      createFakeKwilClient(),
    );

    expect(result.walletType).toBe("FaceSign");
    expect(result.walletIdentifier).toBe("0xface");
    expect(result.walletPublicKey).toBe("facekey");
  });
});

describe("createNearWalletKwilSigner", () => {
  it("returns a NEAR result keyed by the first account's accountId", async () => {
    const publicKey = `ed25519:${bs58Encode(nacl.sign.keyPair().publicKey)}`;
    const wallet = {
      id: "test-wallet",
      getAccounts: async () => [{ accountId: "alice.near" }],
      signMessage: async () => ({
        accountId: "alice.near",
        publicKey,
        signature: "c2lnbmF0dXJl",
      }),
    } as unknown as NearWallet;

    const result = await createNearWalletKwilSigner(
      wallet,
      createFakeStore(),
      createFakeKwilClient(),
    );

    expect(result.walletType).toBe("NEAR");
    expect(result.walletIdentifier).toBe("alice.near");
    expect(result.walletPublicKey).toBe(publicKey);
>>>>>>> 81521f76 (Try to unify and cleanup signers)
  });
});
