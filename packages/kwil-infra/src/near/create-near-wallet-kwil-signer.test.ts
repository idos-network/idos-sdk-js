import type { Wallet as NearWallet } from "@near-wallet-selector/core";

import {
  base64Encode,
  borshSerialize,
  bs58Encode,
  bytesConcat,
  sha256Hash,
} from "@idos-network/utils/codecs";
import { MemoryStore } from "@idos-network/utils/store";
import nacl from "tweetnacl";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { KwilActionClient } from "../create-kwil-client";

import { createNearWalletKwilSigner } from "./create-near-wallet-kwil-signer";

const fullAccess = vi.hoisted(() => ({ keys: [] as string[], queries: 0 }));

vi.mock("near-api-js", () => ({
  connect: async () => ({
    connection: {
      provider: {
        query: async () => {
          fullAccess.queries += 1;
          return {
            keys: fullAccess.keys.map((public_key) => ({
              public_key,
              access_key: { permission: "FullAccess" },
            })),
          };
        },
      },
    },
  }),
}));

const ACCOUNT = "victim.testnet";
const RECIPIENT = "idos.network";
const CALLBACK = "https://app.example/callback";
const MESSAGE = "idOS authentication";
const NEP413_TAG = 2147484061;

const nep413PayloadSchema = {
  struct: {
    message: "string",
    nonce: { array: { type: "u8", len: 32 } },
    recipient: "string",
    callbackUrl: { option: "string" },
  },
} as const;

const keyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(4));
const fragmentKey = `ed25519:${bs58Encode(keyPair.publicKey)}`;
const realKey = `ed25519:${bs58Encode(new Uint8Array(32).fill(1))}`;

const kwilClient = {
  client: { auth: { logoutKGW: async () => {} } },
} as unknown as KwilActionClient;

function signNep413(nonce: Uint8Array, message = MESSAGE): string {
  const hash = sha256Hash(
    bytesConcat(
      borshSerialize("u32", NEP413_TAG),
      borshSerialize(nep413PayloadSchema, {
        message,
        nonce,
        recipient: RECIPIENT,
        callbackUrl: CALLBACK,
      }),
    ),
  );
  return base64Encode(nacl.sign.detached(hash, keyPair.secretKey));
}

function signedRequest(): { nonce: Uint8Array; signature: string } {
  for (let i = 0; i < 64; i++) {
    const nonce = new Uint8Array(32).fill(i);
    const signature = signNep413(nonce);
    if (signature.includes("+")) return { nonce, signature };
  }
  throw new Error("expected a base64 signature containing '+'");
}

async function signerPublicKey(fragment: {
  accountId: string;
  signature: string;
  publicKey: string;
  nonce: Uint8Array;
  message?: string;
}): Promise<string> {
  // Literal "+", not percent-encoded, so URLSearchParams would turn it into a space.
  window.location.hash = `accountId=${fragment.accountId}&signature=${fragment.signature}&publicKey=${fragment.publicKey}`;
  const store = new MemoryStore();
  await store.set("signer-address", ACCOUNT);
  await store.set("signer-public-key", realKey);
  await store.set("sign-last-message", fragment.message ?? MESSAGE);
  await store.set("sign-last-nonce", Array.from(fragment.nonce));
  await store.set("sign-last-url", CALLBACK);
  const wallet = { id: "my-near-wallet", signMessage: vi.fn() } as unknown as NearWallet;

  const { publicKey } = await createNearWalletKwilSigner(wallet, ACCOUNT, store, kwilClient);
  return publicKey;
}

describe("createNearWalletKwilSigner my-near-wallet redirect", () => {
  afterEach(() => {
    window.location.hash = "";
    fullAccess.keys = [];
    fullAccess.queries = 0;
  });

  it("accepts a fragment whose signature matches the saved request and a full-access key", async () => {
    const { nonce, signature } = signedRequest();
    fullAccess.keys = [realKey, fragmentKey];

    expect(
      await signerPublicKey({ accountId: ACCOUNT, signature, publicKey: fragmentKey, nonce }),
    ).toBe(fragmentKey);
    expect(window.location.hash).toBe("");
    expect(fullAccess.queries).toBe(1);
  });

  it("ignores a signature that does not match the saved request", async () => {
    const { nonce, signature } = signedRequest();
    fullAccess.keys = [realKey, fragmentKey];

    expect(
      await signerPublicKey({
        accountId: ACCOUNT,
        signature,
        publicKey: fragmentKey,
        nonce,
        message: "different message",
      }),
    ).toBe(realKey);
    expect(fullAccess.queries).toBe(0);
  });

  it("ignores a fragment for a different account", async () => {
    const { nonce, signature } = signedRequest();
    fullAccess.keys = [realKey, fragmentKey];

    expect(
      await signerPublicKey({
        accountId: "attacker.testnet",
        signature,
        publicKey: fragmentKey,
        nonce,
      }),
    ).toBe(realKey);
    expect(fullAccess.queries).toBe(0);
  });

  it("ignores a public key that is not a full-access key of the account", async () => {
    const { nonce, signature } = signedRequest();
    fullAccess.keys = [realKey];

    expect(
      await signerPublicKey({ accountId: ACCOUNT, signature, publicKey: fragmentKey, nonce }),
    ).toBe(realKey);
    expect(fullAccess.queries).toBe(1);
  });

  it("does not replay an untrusted fragment signature", async () => {
    const { nonce } = signedRequest();
    window.location.hash = `accountId=${ACCOUNT}&signature=sig&publicKey=${fragmentKey}`;
    const store = new MemoryStore();
    await store.set("signer-address", ACCOUNT);
    await store.set("signer-public-key", realKey);
    await store.set("sign-last-message", MESSAGE);
    await store.set("sign-last-nonce", Array.from(nonce));
    await store.set("sign-last-url", CALLBACK);
    const original = vi.fn();
    const wallet = { id: "my-near-wallet", signMessage: original } as unknown as NearWallet;

    await createNearWalletKwilSigner(wallet, ACCOUNT, store, kwilClient);
    void wallet.signMessage?.({
      message: MESSAGE,
      recipient: RECIPIENT,
      nonce: Buffer.alloc(32),
    });

    await vi.waitFor(() => expect(original).toHaveBeenCalledOnce());
    expect(original.mock.calls[0]?.[0].message).toBe(MESSAGE);
  });
});
