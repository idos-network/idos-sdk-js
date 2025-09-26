import { sha256Hash } from "@idos-network/utils/codecs";
import { Keypair, StrKey } from "@stellar/stellar-sdk";

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
    const messageHash = sha256Hash(Buffer.from(SIGN_MESSAGE_PREFIX + message));

    const signatureBuffer = Buffer.from(signature, "hex");

    const publicKeyBuffer = Buffer.from(publicKey, "hex");
    const publicKeyFromStrKey = StrKey.encodeEd25519PublicKey(publicKeyBuffer);
    const keypair = Keypair.fromPublicKey(publicKeyFromStrKey);

    return keypair.verify(Buffer.from(messageHash), signatureBuffer);
  } catch (error) {
    console.warn("Stellar signature verification failed:", error);
    return false;
  }
};
