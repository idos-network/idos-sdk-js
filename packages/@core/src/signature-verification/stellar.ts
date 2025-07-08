import { Keypair, StrKey } from "@stellar/stellar-sdk";

export const verifyStellarSignature = async (
  message: string,
  signature: string,
  publicKey: string,
): Promise<boolean> => {
  try {
    // Convert hex signature to buffer
    const signatureBuffer = Buffer.from(signature, "hex");

    // `Keypair.fromPublicKey()` expects StrKey format, but we're passing as hex (derivePublicKey result).
    const publicKeyBuffer = Buffer.from(publicKey, "hex");
    const strKeyAddress = StrKey.encodeEd25519PublicKey(publicKeyBuffer);

    const keypair = Keypair.fromPublicKey(strKeyAddress);

    const result = keypair.verify(Buffer.from(message), signatureBuffer);

    return result;
  } catch (error) {
    console.warn("Stellar signature verification failed:", error);
    return false;
  }
};
