// publicKey is a string in hex
// signature is a string in hex

import { hexDecode, sha256Hash, utf8Encode } from "@idos-network/utils/codecs";
import { Keypair, StrKey } from "@stellar/stellar-sdk";

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

    const signatureBytes = hexDecode(signature);
    const publicKeyBytes = hexDecode(publicKey);

    const publicKeyFromStrKey = StrKey.encodeEd25519PublicKey(Buffer.from(publicKeyBytes));
    const keypair = Keypair.fromPublicKey(publicKeyFromStrKey);

    return keypair.verify(Buffer.from(messageHash), Buffer.from(signatureBytes));
  } catch (error) {
    console.warn("Stellar signature verification failed:", error);
    return false;
  }
};
