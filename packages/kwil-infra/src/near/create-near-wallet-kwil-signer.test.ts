import type { Wallet as NearWallet } from "@near-wallet-selector/core";

import { bs58Encode } from "@idos-network/utils/codecs";
import { MemoryStore } from "@idos-network/utils/store";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { KwilActionClient } from "../create-kwil-client";

import { createNearWalletKwilSigner } from "./create-near-wallet-kwil-signer";

const fullAccessKeys = vi.hoisted(() => ({ value: [] as string[] }));

vi.mock("near-api-js", () => ({
  connect: async () => ({
    connection: {
      provider: {
        query: async () => ({
          keys: fullAccessKeys.value.map((public_key) => ({
            public_key,
            access_key: { permission: "FullAccess" },
          })),
        }),
      },
    },
  }),
}));

const ACCOUNT = "victim.testnet";
const realKey = `ed25519:${bs58Encode(new Uint8Array(32).fill(1))}`;
const fragmentKey = `ed25519:${bs58Encode(new Uint8Array(32).fill(2))}`;

const kwilClient = {
  client: { auth: { logoutKGW: async () => {} } },
} as unknown as KwilActionClient;

// Simulates returning from a my-near-wallet redirect into a session already bound to realKey.
async function publicKeyAfterRedirect(fragmentAccount: string): Promise<string> {
  window.location.hash = `accountId=${fragmentAccount}&signature=sig&publicKey=${fragmentKey}`;
  const store = new MemoryStore();
  await store.set("signer-address", ACCOUNT);
  await store.set("signer-public-key", realKey);
  const wallet = { id: "my-near-wallet", signMessage: vi.fn() } as unknown as NearWallet;

  const { publicKey } = await createNearWalletKwilSigner(wallet, ACCOUNT, store, kwilClient);
  return publicKey;
}

describe("createNearWalletKwilSigner my-near-wallet redirect", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("ignores a fragment public key that is not a full-access key of the account", async () => {
    fullAccessKeys.value = [realKey];

    expect(await publicKeyAfterRedirect(ACCOUNT)).toBe(realKey);
  });

  it("ignores a fragment for a different account", async () => {
    fullAccessKeys.value = [realKey, fragmentKey];

    expect(await publicKeyAfterRedirect("attacker.testnet")).toBe(realKey);
  });

  it("accepts a fragment public key that is a full-access key of the account", async () => {
    fullAccessKeys.value = [realKey, fragmentKey];

    expect(await publicKeyAfterRedirect(ACCOUNT)).toBe(fragmentKey);
  });
});
