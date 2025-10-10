// TODO: try to get back to use ripple-keypairs again

import { decode as decodeHex } from "@stablelib/hex";
import { encode as utf8Encode } from "@stablelib/utf8";
import nacl from "tweetnacl";

/**
 * Verifies an Ed25519 signature for XRPL messages
 * @param message - The original message string
 * @param signature - The signature in hex format
 * @param publicKey - The public key in hex format with 0xED prefix
 * @returns Promise that resolves to true if signature is valid, false otherwise
 */
export const verifyRippleSignature = async (
  message: string,
  signature: string,
  publicKey: string,
): Promise<boolean> => {
  try {
    // Remove 0xED prefix from public key if present
    const cleanPublicKey = publicKey.toUpperCase().startsWith("ED")
      ? publicKey.slice(2)
      : publicKey;

    const messageBytes = utf8Encode(message);
    const signatureBytes = decodeHex(signature);
    const publicKeyBytes = decodeHex(cleanPublicKey);

    // Verify the signature using Ed25519
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error("Ripple signature verification failed:", error);

    return false;
  }
};
