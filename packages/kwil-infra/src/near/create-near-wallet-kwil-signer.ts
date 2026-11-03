import type { Store } from "@idos-network/utils/store";
import type {
  Wallet as NearWallet,
  SignedMessage,
  SignMessageParams,
} from "@near-wallet-selector/core";
import type { connect as connectT } from "near-api-js";
import type { AccessKeyList } from "near-api-js/lib/providers/provider";

import { KwilSigner } from "@idos-network/kwil-js";
import {
  base64Decode,
  binaryWriteUint16BE,
  bs58Decode,
  bytesConcat,
  hexEncode,
  utf8Decode,
} from "@idos-network/utils/codecs";
import nacl from "tweetnacl";

import type { KwilActionClient } from "../create-kwil-client";

import { getNearConnectionConfig } from "./get-config";
import { nep413SignHash, serializeKwilNep413 } from "./nep413";

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
      // oxlint-disable-next-line typescript/no-non-null-assertion -- Only non-signing wallets return void.
    } = (await (
      wallet.signMessage as (
        _: SignMessageParams,
      ) => Promise<SignedMessage & { nonce?: Uint8Array }>
    )({
      message: messageString,
      recipient,
      nonce: nonceSuggestion,
    }))!;

    const nep413BorshPayload = serializeKwilNep413({
      message: messageString,
      nonce: Array.from(nonce),
      recipient,
      callbackUrl,
    });
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
  return hexEncode(bs58Decode(key_without_prefix), true);
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

type NearRedirect = {
  accountId?: string;
  publicKey?: string;
  signature?: string;
  error?: string;
};

function parseNearRedirect(hash: string): NearRedirect {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const signature = params.get("signature");
  return {
    accountId: params.get("accountId") ?? undefined,
    publicKey: params.get("publicKey") ?? undefined,
    // URLSearchParams decodes a literal "+" as a space. NEP-413 signatures are base64.
    signature: signature?.replaceAll(" ", "+"),
    error: params.get("error") ?? undefined,
  };
}

function takeNearRedirect(): NearRedirect {
  const redirect = parseNearRedirect(window.location.hash);
  if (!redirect.accountId && !redirect.publicKey && !redirect.signature && !redirect.error) {
    return redirect;
  }

  const params = new URLSearchParams(window.location.hash.slice(1));
  for (const key of ["accountId", "publicKey", "signature", "error", "state"]) params.delete(key);
  const rest = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${rest ? `#${rest}` : ""}`,
  );
  return redirect;
}

function verifyNep413Signature(
  message: string,
  nonce: Uint8Array,
  recipient: string,
  callbackUrl: string,
  signature: string,
  publicKey: string,
): boolean {
  const pieces = publicKey.split(":");
  if (pieces.length !== 2 || pieces[0] !== "ed25519" || !pieces[1] || nonce.length !== 32) {
    return false;
  }

  try {
    const publicKeyBytes = bs58Decode(pieces[1]);
    const signatureBytes = base64Decode(signature);
    if (publicKeyBytes.length !== 32 || signatureBytes.length !== 64) return false;

    return nacl.sign.detached.verify(
      nep413SignHash({ message, nonce, recipient, callbackUrl }),
      signatureBytes,
      publicKeyBytes,
    );
  } catch {
    return false;
  }
}

// The hash is attacker-controlled. A signature is only the wallet's if it verifies
// against the request we stored before the redirect, for a full-access key of this account.
async function trustedNearRedirect(
  redirect: NearRedirect,
  currentAddress: string,
  recipient: string,
  store: Store,
): Promise<{ signature: string; publicKey: string } | undefined> {
  if (
    redirect.error ||
    !redirect.signature ||
    !redirect.publicKey ||
    redirect.accountId !== currentAddress
  ) {
    return;
  }

  const message = await store.get<string>("sign-last-message");
  const savedNonce = await store.get<number[] | Uint8Array>("sign-last-nonce");
  const callbackUrl = await store.get<string>("sign-last-url");
  if (!message || !savedNonce || !callbackUrl) return;

  const nonce = Uint8Array.from(savedNonce);
  if (
    !verifyNep413Signature(
      message,
      nonce,
      recipient,
      callbackUrl,
      redirect.signature,
      redirect.publicKey,
    )
  ) {
    return;
  }

  const keys = await getNearFullAccessPublicKeys(currentAddress);
  if (!keys?.includes(redirect.publicKey)) return;

  return { signature: redirect.signature, publicKey: redirect.publicKey };
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
    const redirect = takeNearRedirect();
    const trusted = await trustedNearRedirect(redirect, currentAddress, recipient, store);

    if (trusted) {
      await store.set("signer-address", currentAddress);
      await store.set("signer-public-key", trusted.publicKey);
    }

    const signMessageOriginal = wallet.signMessage.bind(wallet);

    wallet.signMessage = async ({
      message,
      recipient: signRecipient,
    }: SignMessageParams): Promise<SignedMessage & { nonce?: Uint8Array }> => {
      if (redirect.error) return Promise.reject();

      const lastMessage = await store.get<string>("sign-last-message");
      const lastNonce = await store.get<Uint8Array>("sign-last-nonce");

      if (trusted && message === lastMessage && lastNonce) {
        const nonce = Buffer.from(lastNonce);
        const callbackUrl = await store.get<string>("sign-last-url");

        return Promise.resolve({
          accountId: currentAddress,
          publicKey: trusted.publicKey,
          signature: trusted.signature,
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

      signMessageOriginal({ message, nonce, recipient: signRecipient, callbackUrl });

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
    const signResult = await wallet.signMessage({ message, recipient, nonce });
    if (!signResult) throw new Error("signMessage returned no result");
    ({ publicKey } = signResult);

    await store.set("signer-address", currentAddress);
    await store.set("signer-public-key", publicKey);
  }

  const signer = createNearWalletSigner(wallet, recipient);

  return {
    kwilSigner: new KwilSigner(signer, implicitAddressFromPublicKey(publicKey), "nep413"),
    publicKey,
  };
}
