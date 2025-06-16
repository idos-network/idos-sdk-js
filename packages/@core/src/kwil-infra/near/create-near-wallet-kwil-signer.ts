import { KwilSigner } from "@kwilteam/kwil-js";
import type {
  Wallet as NearWallet,
  SignMessageParams,
  SignedMessage,
} from "@near-wallet-selector/core";
import {
  base64Decode,
  binaryWriteUint16BE,
  borshSerialize,
  bytesConcat,
  hexEncode,
  utf8Decode,
} from "../../codecs";
import type { Store } from "../../store";
import type { KwilActionClient } from "../create-kwil-client";
import { implicitAddressFromPublicKey } from "../nep413";

const NEAR_WALLET_TYPES: string[] = [
  "browser",
  "injected",
  "instant-link",
  "hardware",
  "bridge",
] satisfies NearWallet["type"][];

export function looksLikeNearWallet(signer: unknown): signer is NearWallet {
  return (
    signer !== null &&
    typeof signer === "object" &&
    "id" in signer &&
    "metadata" in signer &&
    "type" in signer &&
    typeof signer.type === "string" &&
    NEAR_WALLET_TYPES.includes(signer.type)
  );
}

class KwilNonce {
  bytes: Uint8Array;

  constructor(length = 32) {
    // We're in the browser, so there's a window.crypto for sure.
    /* global crypto */
    this.bytes = crypto.getRandomValues(new Uint8Array(length));
  }

  get clampUTF8() {
    return this.bytes.map((byte) => byte & 127);
  }
}

/**
 * Creates a signer function that can be used to sign messages with a NEAR wallet
 */
function createNearWalletSigner(
  wallet: NearWallet,
  recipient: string,
): (message: string | Uint8Array) => Promise<Uint8Array> {
  return async (message: string | Uint8Array): Promise<Uint8Array> => {
    const messageString = typeof message === "string" ? message : utf8Decode(message);

    if (!wallet.signMessage) {
      throw new Error("Only wallets with signMessage are supported.");
    }

    const nonceSuggestion = Buffer.from(new KwilNonce(32).bytes);

    const {
      nonce = nonceSuggestion,
      signature,
      // @ts-ignore Signatures don't seem to be updated for NEP413 yet.
      callbackUrl,
      // biome-ignore lint/style/noNonNullAssertion: Only non-signing wallets return void.
    } = (await (
      wallet.signMessage as (
        _: SignMessageParams,
      ) => Promise<SignedMessage & { nonce?: Uint8Array }>
    )({
      message: messageString,
      recipient,
      nonce: nonceSuggestion,
    }))!;

    const nep413BorschSchema = {
      struct: {
        tag: "u32",
        message: "string",
        nonce: { array: { type: "u8", len: 32 } },
        recipient: "string",
        callbackUrl: { option: "string" },
      },
    };

    const nep413BorshParams = {
      tag: 2147484061,
      message: messageString,
      nonce: Array.from(nonce),
      recipient,
      callbackUrl,
    };

    const nep413BorshPayload = borshSerialize(nep413BorschSchema, nep413BorshParams);

    return bytesConcat(
      binaryWriteUint16BE(nep413BorshPayload.length),
      nep413BorshPayload,
      base64Decode(signature),
    );
  };
}

export async function signNearMessage(
  wallet: NearWallet,
  message: string,
  recipient = "idos.network",
): Promise<string> {
  const signer = createNearWalletSigner(wallet, recipient);
  const signedPayload = await signer(message);
  return hexEncode(signedPayload);
}

export async function createNearWalletKwilSigner(
  wallet: NearWallet,
  currentAddress: string,
  store: Store,
  kwilClient: KwilActionClient,
  recipient = "idos.network",
): Promise<KwilSigner> {
  if (!wallet.signMessage) throw new Error("Only wallets with signMessage are supported.");

  if (wallet.id === "my-near-wallet") {
    const { accountId, signature, publicKey, error } = Object.fromEntries(
      new URLSearchParams(window.location.hash.slice(1)).entries(),
    );

    if (signature) {
      store.set("signer-address", accountId);
      store.set("signer-public-key", publicKey);
    }

    const signMessageOriginal = wallet.signMessage.bind(wallet);

    wallet.signMessage = async ({
      message,
      recipient,
    }: SignMessageParams): Promise<SignedMessage & { nonce?: Uint8Array }> => {
      if (error) return Promise.reject();

      const lastMessage = store.get("sign-last-message");
      if (signature && message === lastMessage) {
        const nonce = Buffer.from(store.get("sign-last-nonce"));
        const callbackUrl = store.get("sign-last-url");

        return Promise.resolve({
          accountId: currentAddress,
          publicKey,
          signature,
          nonce,
          message,
          callbackUrl,
        } as SignedMessage);
      }
      const callbackUrl = window.location.href;
      const nonce = Buffer.from(new KwilNonce(32).clampUTF8);

      store.set("sign-last-message", message);
      store.set("sign-last-nonce", Array.from(nonce));
      store.set("sign-last-url", callbackUrl);

      signMessageOriginal({ message, nonce, recipient, callbackUrl });

      return new Promise(() => ({}) as SignedMessage);
    };
  }

  const storedAddress = store.get("signer-address");

  let publicKey = store.get("signer-public-key");

  if (storedAddress !== currentAddress || !publicKey) {
    store.reset();
    // To avoid re-using the old signer's kgw cookie.
    // When kwil-js supports multi cookies, we can remove this.
    await kwilClient.client.auth.logoutKGW();

    const message = "idOS authentication";
    const nonce = Buffer.from(new KwilNonce(32).bytes);
    // biome-ignore lint/style/noNonNullAssertion: Only non-signing wallets return void.
    ({ publicKey } = (await wallet.signMessage({ message, recipient, nonce }))!);

    store.set("signer-address", currentAddress);
    store.set("signer-public-key", publicKey);
  }

  const signer = createNearWalletSigner(wallet, recipient);

  return new KwilSigner(signer, implicitAddressFromPublicKey(publicKey), "nep413");
}
