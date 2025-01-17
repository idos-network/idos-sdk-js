import { implicitAddressFromPublicKey, kwilNep413Signer } from "@idos-network/kwil-nep413-signer";
import { KwilSigner } from "@kwilteam/kwil-js";
import bs58 from "bs58";
import type { Wallet } from "ethers";
import type { KeyPair } from "near-api-js";
import nacl from "tweetnacl";

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

type KwilSignerType = KeyPair | Wallet | nacl.SignKeyPair;
type SignerAddress = string;

/**
 * Helper function to create a `KwilSigner` and its associated `SignerAddress`.
 * Useful for creating a `KwilSigner` and its associated `SignerAddress` for the `idOSGrantee` constructor.
 */
export function createKwilSigner(signer: KwilSignerType): [KwilSigner, SignerAddress] {
  if (isNaclSignKeyPair(signer)) {
    return [
      new KwilSigner(
        async (msg: Uint8Array) => nacl.sign.detached(msg, signer.secretKey),
        signer.publicKey,
        "ed25519",
      ),
      implicitAddressFromPublicKey(bs58.encode(signer.publicKey)),
    ];
  }

  if (isNearKeyPair(signer)) {
    return [
      new KwilSigner(
        kwilNep413Signer("idos-issuer")(signer),
        implicitAddressFromPublicKey(signer.getPublicKey().toString()),
        "nep413",
      ),
      implicitAddressFromPublicKey(signer.getPublicKey().toString()),
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
