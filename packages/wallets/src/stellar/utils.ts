import { StrKey, verify } from "@stellar/stellar-base";

export const verifySignInMessage = async (
  address: string,
  message: string,
  signature: string,
): Promise<boolean> => {
  const publicKeyRaw = StrKey.decodeEd25519PublicKey(address);

  return verify(Buffer.from(message, "base64"), Buffer.from(signature, "base64"), publicKeyRaw);
};
