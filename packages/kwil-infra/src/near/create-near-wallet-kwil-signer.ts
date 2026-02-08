import { KwilSigner } from "@idos-network/kwil-js";
import {
  base64Decode,
  binaryWriteUint16BE,
  borshSerialize,
  bs58Decode,
  bytesConcat,
  hexEncode,
  utf8Decode,
} from "@idos-network/utils/codecs";

import type { Store } from "@idos-network/utils/store";
import type {
  Wallet as NearWallet,
  SignedMessage,
  SignMessageParams,
} from "@near-wallet-selector/core";
import type { connect as connectT } from "near-api-js";
import type { AccessKeyList } from "near-api-js/lib/providers/provider";
import type { KwilActionClient } from "../create-kwil-client";
import { getNearConnectionConfig } from "./get-config";

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
      // @ts-expect-error Signatures don't seem to be updated for NEP413 yet.
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
    const result = bytesConcat(
      binaryWriteUint16BE(nep413BorshPayload.length),
      nep413BorshPayload,
      base64Decode(signature),
    );

    return result;
  };
}

export function implicitAddressFromPublicKey(publicKey: string): string {
  const key_without_prefix = publicKey.replace(/^ed25519:/, "");
  return hexEncode(bs58Decode(key_without_prefix));
}

export async function getNearFullAccessPublicKeys(
  namedAddress: string,
): Promise<string[] | undefined> {
  let connect: typeof connectT;
  try {
    connect = (await import("near-api-js")).connect;
  } catch (_e) {
    throw new Error("Can't load near-api-js");
  }
  const connectionConfig = getNearConnectionConfig(namedAddress);
  const nearConnection = await connect(connectionConfig);

  try {
    const response: AccessKeyList = await nearConnection.connection.provider.query({
      request_type: "view_access_key_list",
      finality: "final",
      account_id: namedAddress,
    });
    return response.keys
      .filter((element) => element.access_key.permission === "FullAccess")
      ?.map((i) => i.public_key);
  } catch {
    // `Near` failed if namedAddress contains uppercase symbols
    return;
  }
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
): Promise<{ kwilSigner: KwilSigner; publicKey: string }> {
  if (!wallet.signMessage) throw new Error("Only wallets with signMessage are supported.");

  if (wallet.id === "my-near-wallet") {
    const { accountId, signature, publicKey, error } = Object.fromEntries(
      new URLSearchParams(window.location.hash.slice(1)).entries(),
    );

    if (signature) {
      await store.set("signer-address", accountId);
      await store.set("signer-public-key", publicKey);
    }

    const signMessageOriginal = wallet.signMessage.bind(wallet);

    wallet.signMessage = async ({
      message,
      recipient,
    }: SignMessageParams): Promise<SignedMessage & { nonce?: Uint8Array }> => {
      if (error) return Promise.reject();

      const lastMessage = await store.get<string>("sign-last-message");
      const lastNonce = await store.get<Uint8Array>("sign-last-nonce");

      if (signature && message === lastMessage && lastNonce) {
        const nonce = Buffer.from(lastNonce);
        const callbackUrl = await store.get<string>("sign-last-url");

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

      await store.set("sign-last-message", message);
      await store.set("sign-last-nonce", Array.from(nonce));
      await store.set("sign-last-url", callbackUrl);

      signMessageOriginal({ message, nonce, recipient, callbackUrl });

      return new Promise(() => ({}) as SignedMessage);
    };
  }

  const storedAddress = await store.get<string>("signer-address");

  let publicKey = await store.get<string>("signer-public-key");

  if (storedAddress !== currentAddress || !publicKey) {
    store.reset();
    // To avoid re-using the old signer's kgw cookie.
    // When kwil-js supports multi cookies, we can remove this.
    await kwilClient.client.auth.logoutKGW();

    const message = "idOS authentication";
    const nonce = Buffer.from(new KwilNonce(32).bytes);
    ({ publicKey } = (await wallet.signMessage({ message, recipient, nonce }))!);

    await store.set("signer-address", currentAddress);
    await store.set("signer-public-key", publicKey);
  }

  const signer = createNearWalletSigner(wallet, recipient);

  return {
    kwilSigner: new KwilSigner(signer, implicitAddressFromPublicKey(publicKey), "nep413"),
    publicKey,
  };
}
