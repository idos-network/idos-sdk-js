import { KwilSigner } from "@idos-network/kwil-js";
import { bs58Encode, hexDecode, hexEncode } from "@idos-network/utils/codecs";
import type { Store } from "@idos-network/utils/store";
import type { Keypair as StellarKeypair } from "@stellar/stellar-sdk";
import type { Wallet as EthersWallet, JsonRpcSigner } from "ethers";
import type { KeyPair as NearKeyPair } from "near-api-js";
import * as xrpKeypair from "ripple-keypairs";
import type { KeyPair as XrpKeyPair } from "ripple-keypairs/src/types";
import nacl from "tweetnacl";
import type { KwilActionClient } from "../kwil-infra/create-kwil-client";
import type { Wallet } from "../types";
import {
  createNearWalletKwilSigner,
  implicitAddressFromPublicKey,
  looksLikeNearWallet,
} from "./near/create-near-wallet-kwil-signer";
import { kwilNep413Signer } from "./nep413";
import { createXrpKwilSigner } from "./xrp/create-xrp-signer";
import { getXrpPublicKey, looksLikeXrpWallet } from "./xrp/utils";

/**
 * Helper function to check if the given object is a `nacl.SignKeyPair`.
 */
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

export interface CustomKwilSigner extends KwilSigner {
  publicAddress: string;
  signatureType: string;
  publicKey: string;
}

/**
 * Helper function to check if the given object is a XRP KeyPair (Server key pairs only).
 */
function isXrplKeyPair(signer: unknown): signer is XrpKeyPair {
  return (
    !!signer &&
    typeof signer === "object" &&
    "privateKey" in signer &&
    "publicKey" in signer &&
    "signer_type" in signer &&
    signer.signer_type === "xrpl"
  );
}

export type KwilSignerType =
  | NearKeyPair
  | EthersWallet
  | nacl.SignKeyPair
  | JsonRpcSigner
  | StellarKeypair
  | XrpKeyPair;

export type SignerAddress = string;
export type SignerPublicKey = string | undefined;
export type SignerType = string;
/**
 * Creates a `KwilSigner` and its associated `SignerAddress`.
 *
 * This function is explicitly marked as being for backend use only because it doesn't reset
 * the KGW cookie when logging out and re-logging in with a different wallet.
 */
export function createServerKwilSigner(signer: KwilSignerType): [KwilSigner, SignerAddress] {
  if (isXrplKeyPair(signer)) {
    return [
      new KwilSigner(
        async (msg: Uint8Array) => hexDecode(xrpKeypair.sign(hexEncode(msg), signer.privateKey)),
        signer.publicKey,
        "xrpl",
      ),
      signer.publicKey,
    ];
  }

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
  wallet: Wallet,
): Promise<[KwilSigner, SignerAddress, SignerPublicKey, SignerType]> {
  if ("connect" in wallet && "address" in wallet) {
    //biome-ignore lint/style/noParameterAssign: we're narrowing the type on purpose.
    wallet = wallet as unknown as JsonRpcSigner;
    const currentAddress = await wallet.getAddress();

    const storedAddress = await store.get<string>("signer-address");

    if (storedAddress !== currentAddress) {
      // To avoid re-using the old signer's kgw cookie.
      // When kwil-js supports multi cookies, we can remove this.
      store.set("signer-address", currentAddress);
      try {
        await kwilClient.client.auth.logoutKGW();
      } catch (error) {
        console.log("error logoutKGW", error);
      }
    }

    return [new KwilSigner(wallet, currentAddress), currentAddress, undefined, "evm"];
  }

  if (looksLikeNearWallet(wallet)) {
    const accounts = await wallet.getAccounts();
    const { kwilSigner, publicKey } = await createNearWalletKwilSigner(
      wallet,
      accounts[0].accountId,
      store,
      kwilClient,
    );

    return [kwilSigner, accounts[0].accountId, publicKey, "near"];
  }

  if (looksLikeXrpWallet(wallet)) {
    const { address: currentAddress, publicKey: walletPublicKey } = (await getXrpPublicKey(
      wallet,
    )) as { address: string; publicKey: string };
    if (!currentAddress) {
      throw new Error("Failed to get XRP address");
    }
    console.log({ currentAddress, walletPublicKey });

    return [
      await createXrpKwilSigner(wallet, currentAddress, store, kwilClient, walletPublicKey),
      currentAddress,
      walletPublicKey,
      "xrpl",
    ];
  }

  if ("signatureType" in wallet && "publicAddress" in wallet) {
    return [wallet, wallet.publicAddress, wallet.publicKey, "stellar"];
  }

  // Force the check that `signer` is `never`.
  // If these lines start complaining, that means we're missing an `if` above.
  return ((_: never) => {
    throw new Error("Invalid `signer` type");
  })(wallet);
}
