import { hashMessage, isHex, recoverPublicKey, type Hex } from "viem";

/** Uncompressed secp256k1 key. `add_wallet` rejects an EVM wallet that omits one. */
export async function evmPublicKeyFromSignature(message: string, signature: string): Promise<Hex> {
  if (!isHex(signature)) throw new Error("EVM signature must be hex");
  return recoverPublicKey({
    hash: hashMessage(message),
    signature,
  });
}
