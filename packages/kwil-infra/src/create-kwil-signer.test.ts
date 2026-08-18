import type { Store } from "@idos-network/utils/store";
import type { Wallet as NearWallet } from "@near-wallet-selector/core";
import type { JsonRpcSigner } from "ethers";

import { bs58Encode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";
import { describe, expect, it, vi } from "vitest";

import type { KwilActionClient } from "./create-kwil-client";

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
  });
});
