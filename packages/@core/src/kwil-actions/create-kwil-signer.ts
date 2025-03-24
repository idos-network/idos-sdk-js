import { KwilSigner } from "@kwilteam/kwil-js";
import type { Wallet as EthersWallet, JsonRpcSigner } from "ethers";
import type { KeyPair } from "near-api-js";
import nacl from "tweetnacl";
import { bs58Encode } from "../codecs";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "../kwil-nep413-signer";
import type { Store } from "../store";
import type { Wallet } from "../types";
import type { KwilActionClient } from "./create-kwil-client";
import { createNearWalletKwilSigner, looksLikeNearWallet } from "./create-near-wallet-kwil-signer";

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
function isNearKeyPair(object: unknown): object is KeyPair {
  return (
    object !== null &&
    typeof object === "object" &&
    "getPublicKey" in object &&
    "sign" in object &&
    typeof object.getPublicKey === "function" &&
    typeof object.sign === "function"
  );
}

export type KwilSignerType = KeyPair | EthersWallet | nacl.SignKeyPair | JsonRpcSigner;
export type SignerAddress = string;

/**
 * Creates a `KwilSigner` and its associated `SignerAddress`.
 *
 * This function is explicitly marked as being for backend use only because it doesn't reset
 * the KGW cookie when logging out and re-logging in with a different wallet.
 */
export function createBackendKwilSigner(signer: KwilSignerType): [KwilSigner, SignerAddress] {
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

  if ("address" in signer) {
    return [new KwilSigner(signer, signer.address), signer.address];
  }

  // Force the check that `signer` is never.
  // If these lines start complaining, that means we're missing an `if` above.
  return ((_: never) => {
    throw new Error("Invalid `signer` type");
  })(signer);
}

export async function createFrontendKwilSigner(
  store: Store,
  kwilClient: KwilActionClient,
  wallet: Wallet,
): Promise<[KwilSigner, SignerAddress]> {
  if ("connect" in wallet && "address" in wallet) {
    //biome-ignore lint/style/noParameterAssign: we're narrowing the type on purpose.
    wallet = wallet as unknown as JsonRpcSigner;
    const currentAddress = await wallet.getAddress();

    const storedAddress = store.get("signer-address");

    if (storedAddress !== currentAddress) {
      // To avoid re-using the old signer's kgw cookie.
      // When kwil-js supports multi cookies, we can remove this.
      await kwilClient.client.auth.logoutKGW();

      store.set("signer-address", currentAddress);
    }

    return [new KwilSigner(wallet, currentAddress), currentAddress];
  }

  if (looksLikeNearWallet(wallet)) {
    const accountId = (await wallet.getAccounts())[0].accountId;

    return [await createNearWalletKwilSigner(wallet, accountId, store, kwilClient), accountId];
  }

  // Force the check that `signer` is never.
  // If these lines start complaining, that means we're missing an `if` above.
  return ((_: never) => {
    throw new Error("Invalid `signer` type");
  })(wallet);
}
