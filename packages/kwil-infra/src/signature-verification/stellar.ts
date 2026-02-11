export const verifyStellarSignature = async (
  message: string,
  signature: string,
  publicKey: string,
): Promise<boolean> => {
  let stellar: typeof import("@stellar/stellar-sdk");

  try {
    stellar = await import("@stellar/stellar-sdk");
  } catch (e) {
    throw new Error("Can't load `@stellar/stellar-sdk`", { cause: e });
  }

  try {
    // Convert hex signature to buffer
    const signatureBuffer = Buffer.from(signature, "hex");

    // `Keypair.fromPublicKey()` expects StrKey format, but we're passing as hex (derivePublicKey result).
    const publicKeyBuffer = Buffer.from(publicKey, "hex");
    const strKeyAddress = stellar.StrKey.encodeEd25519PublicKey(publicKeyBuffer);

    const keypair = stellar.Keypair.fromPublicKey(strKeyAddress);

    const result = keypair.verify(Buffer.from(message), signatureBuffer);

    return result;
  } catch (error) {
    console.warn("Stellar signature verification failed:", error);
    return false;
  }
};
