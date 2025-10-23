import { decode as decodeHex } from "@stablelib/hex";
import { encode as utf8Encode } from "@stablelib/utf8";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { sha256Hash } from "../../codecs";

// publicKey is a string in hex
// signature is a string in hex
// message is a string in UTF-8
export const verifyStellarSignature = async (
  message: string,
  signature: string,
  publicKey: string,
): Promise<boolean> => {
  try {
    const SIGN_MESSAGE_PREFIX = "Stellar Signed Message:\n";
    const prefixedMessage = utf8Encode(SIGN_MESSAGE_PREFIX + message);
    const messageHash = sha256Hash(prefixedMessage);

    const signatureBytes = decodeHex(signature);
    const publicKeyBytes = decodeHex(publicKey);

    const publicKeyFromStrKey = StrKey.encodeEd25519PublicKey(Buffer.from(publicKeyBytes));
    const keypair = Keypair.fromPublicKey(publicKeyFromStrKey);

    return keypair.verify(Buffer.from(messageHash), Buffer.from(signatureBytes));
  } catch (error) {
    console.warn("Stellar signature verification failed:", error);
    return false;
  }
};
