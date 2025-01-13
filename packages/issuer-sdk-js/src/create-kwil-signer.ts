import { KwilSigner } from "@kwilteam/kwil-js";
import { Wallet } from "ethers";
import { KeyPair } from "near-api-js";
import nacl from "tweetnacl";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "../../kwil-nep413-signer/src";

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

type KwilSignerType = KeyPair | Wallet | nacl.SignKeyPair;

export function createKwilSigner(signer: KwilSignerType): KwilSigner {
  if (isNaclSignKeyPair(signer)) {
    return new KwilSigner(
      async (msg: Uint8Array) => nacl.sign.detached(msg, signer.secretKey),
      signer.publicKey,
      "ed25519",
    );
  }

  if (signer instanceof KeyPair) {
    return new KwilSigner(
      kwilNep413Signer("idos-issuer")(signer),
      implicitAddressFromPublicKey(signer.getPublicKey().toString()),
      "nep413",
    );
  }

  if (signer instanceof Wallet) {
    return new KwilSigner(signer, signer.address);
  }

  // Force the check that `signer` is never.
  // If these lines start complaining, that means we're missing an `if` above.
  return ((_: never) => {
    throw new Error("Invalid signer type");
  })(signer);
}
