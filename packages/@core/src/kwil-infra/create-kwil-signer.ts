import { KwilSigner } from "@kwilteam/kwil-js";
import type { Keypair as StellarKeypair } from "@stellar/stellar-sdk";
import type { JsonRpcSigner, Wallet as EthersWallet } from "ethers";
import type { KeyPair as NearKeyPair } from "near-api-js";
import nacl from "tweetnacl";
import { bs58Encode } from "../codecs";
import type { KwilActionClient } from "../kwil-infra/create-kwil-client";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "../kwil-nep413-signer";
import type { Store } from "../store";
import type { WalletInfo } from "../types";

import { base64Decode, binaryWriteUint16BE, borshSerialize, bytesConcat } from "../codecs";

/**
 * Helper function to check if the given object is a `nacl.SignKeyPair`.
 */

export function formatNearMessage(
  signature: string,
  message: string,
  nonce: Uint8Array,
  recipient: string,
  callbackUrl: string,
): Uint8Array {
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
    message,
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
}

function isNaclSignKeyPair(object: unknown): object is nacl.SignKeyPair {
  return (
    object !== null &&
    typeof object === "object" &&
    "publicKey" in object &&
    object.publicKey instanceof Uint8Array &&
    object.publicKey.length === nacl.sign.publicKeyLength &&
    "secretKey" in object &&
    object.secretKey instanceof Uint8Array &&
    object.secretKey.length === nacl.sign.secretKeyLength
  );
}

/**
 * Helper function to check if the given object is a NEAR KeyPair.
 */
function isNearKeyPair(object: unknown): object is NearKeyPair {
  return (
    object !== null &&
    typeof object === "object" &&
    "getPublicKey" in object &&
    "sign" in object &&
    typeof object.getPublicKey === "function" &&
    typeof object.sign === "function"
  );
}

/**
 * Helper function to check if the given object is a Stellar Keypair.
 */
function isStellarKeyPair(object: unknown): object is StellarKeypair {
  return (
    object !== null &&
    typeof object === "object" &&
    "publicKey" in object &&
    "sign" in object &&
    "canSign" in object &&
    typeof object.publicKey === "function" &&
    typeof object.sign === "function" &&
    typeof object.canSign === "function"
  );
}

export type KwilSignerType =
  | NearKeyPair
  | EthersWallet
  | nacl.SignKeyPair
  | JsonRpcSigner
  | StellarKeypair;
export type SignerAddress = string;

/**
 * Creates a `KwilSigner` and its associated `SignerAddress`.
 *
 * This function is explicitly marked as being for backend use only because it doesn't reset
 * the KGW cookie when logging out and re-logging in with a different wallet.
 */
export function createServerKwilSigner(signer: KwilSignerType): [KwilSigner, SignerAddress] {
  if (isNaclSignKeyPair(signer)) {
    return [
      new KwilSigner(
        async (msg: Uint8Array) => nacl.sign.detached(msg, signer.secretKey),
        signer.publicKey,
        "ed25519",
      ),
      implicitAddressFromPublicKey(bs58Encode(signer.publicKey)),
    ];
  }

  if (isNearKeyPair(signer)) {
    const publicKey = implicitAddressFromPublicKey(signer.getPublicKey().toString());
    return [
      new KwilSigner(kwilNep413Signer("idos-issuer")(signer), publicKey, "nep413"),
      publicKey,
    ];
  }

  if (isStellarKeyPair(signer)) {
    const publicKeyString = signer.publicKey();
    const rawPublicKey = signer.rawPublicKey();
    return [
      new KwilSigner(
        async (msg: Uint8Array) => signer.sign(Buffer.from(msg)),
        rawPublicKey,
        "ed25519",
      ),
      publicKeyString,
    ];
  }

  if ("address" in signer) {
    return [new KwilSigner(signer, signer.address), signer.address];
  }

  // Force the check that `signer` is never.
  // If these lines start complaining, that means we're missing an `if` above.
  return ((_: never) => {
    throw new Error("Invalid `signer` type");
  })(signer);
}

export async function createClientKwilSigner(
  store: Store,
  kwilClient: KwilActionClient,
  wallet: WalletInfo,
): Promise<[KwilSigner, SignerAddress]> {
  const currentAddress = wallet.address; // xrp => GemWallet.getAddress
  const signer = await wallet.signer();
  const storedAddress = store.get("signer-address");

  if (storedAddress && storedAddress !== currentAddress) {
    // To avoid re-using the old signer's kgw cookie.
    // When kwil-js supports multi cookies, we can remove this.
    store.set("signer-address", currentAddress);
    try {
      await kwilClient.client.auth.logoutKGW();
    } catch (error) {
      console.log("error logoutKGW", error);
    }
  }

  // @todo: fix near signer
  // if (wallet.type === "near") {
  //   const accountId = (await wallet.signer()).getPublicKey();
  //   return [await createNearWalletKwilSigner(wallet, accountId, store, kwilClient), accountId];
  // }

  if (wallet.type === "evm") {
    return [new KwilSigner(signer as JsonRpcSigner, currentAddress), currentAddress];
  }
  if (typeof signer !== "function") throw new Error("Invalid `signer` type");

  if (wallet.type === "xrpl") {
    return [new KwilSigner(signer, wallet.publicKey, "xrpl"), currentAddress];
  }
  if (wallet.type === "steller") {
    return [new KwilSigner(signer, wallet.publicKey, "ed25519"), currentAddress];
  }
  if (wallet.type === "near") {
    console.log({ wallet: wallet.publicKey, currentAddress });

    return [new KwilSigner(signer, wallet.publicKey, "nep413"), currentAddress];
  }
  // if (wallet.type === "near" && !(signer instanceof JsonRpcSigner)) {
  //   return [
  //      createNearWalletKwilSigner(wallet, wallet.publicKey, store, kwilClient),
  //     currentAddress,
  //   ];
  // }
  console.log({ wallet: wallet.type });

  // Force the check that `signer` is `never`.
  // If these lines start complaining, that means we're missing an `if` above.
  return ((_: never) => {
    throw new Error("Invalid `signer` type");
  })(wallet.type);
}
