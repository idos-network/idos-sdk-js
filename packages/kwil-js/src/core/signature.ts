import { hexToBytes } from "../utils/serial";
import { Base64String, HexString, Nillable, NonNil, Promisy } from "../utils/types";
import { BytesEncodingStatus, PayloadBytesTypes } from "./enums";

export interface Signature<T extends PayloadBytesTypes> {
  sig: Nillable<T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : Uint8Array>;
  type: CustomSignatureType;
}

export enum SignatureType {
  SIGNATURE_TYPE_INVALID = "invalid",
  SECP256K1_PERSONAL = "secp256k1_ep",
  ED25519 = "ed25519",
}

// Eth Signer is any class with a signMessage() method. This is supported by Ethers v5 and Ethers v6.
export type EthSigner = {
  signMessage: (message: string | Uint8Array) => Promise<string>;
};

export type CustomSigner = NonNil<(message: Uint8Array) => Promise<Uint8Array>>;
export type SignerSupplier = Promisy<EthSigner | CustomSigner>;

export interface AuthBody {
  signature: Base64String;
  challenge: HexString;
}

export type CustomSignatureType = string;

export type AnySignatureType = SignatureType | CustomSignatureType;

export function getSignatureType(signer: SignerSupplier): SignatureType {
  if (isEthersSigner(signer)) {
    return SignatureType.SECP256K1_PERSONAL;
  }

  return SignatureType.SIGNATURE_TYPE_INVALID;
}

async function ethSign(message: Uint8Array, signer: EthSigner): Promise<HexString> {
  return await signer.signMessage(message);
}

export function isEthersSigner(signer: SignerSupplier): boolean {
  if (
    typeof signer === "object" &&
    signer !== null &&
    "signMessage" in signer &&
    typeof signer.signMessage === "function"
  ) {
    return true;
  }

  return false;
}

export async function executeSign(
  msg: Uint8Array,
  signer: SignerSupplier,
  signatureType: AnySignatureType,
): Promise<Uint8Array> {
  if (isEthersSigner(signer) && signatureType === SignatureType.SECP256K1_PERSONAL) {
    const hexSig = await ethSign(msg, signer as EthSigner);
    let sigBytes = hexToBytes(hexSig);

    return sigBytes;
  }

  if (!isEthersSigner(signer) && signatureType !== SignatureType.SIGNATURE_TYPE_INVALID) {
    if (typeof signer === "function") {
      const signature = await signer(msg);
      return signature;
    } else {
      throw new Error(
        "Something went wrong signing! Make sure your signer is a function that returns a Uint8Array.",
      );
    }
  }

  throw new Error(
    "Could not execute signature. Make sure you pass a signer from EtherJS or a function that returns a Uint8Array.",
  );
}
