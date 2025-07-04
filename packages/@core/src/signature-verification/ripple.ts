import { verify } from "ripple-keypairs";

export const verifyRippleSignature = async (
  message: string,
  signature: string,
  publicKey: string,
): Promise<boolean> => {
  const messageHex = Buffer.from(message).toString("hex");
  return verify(messageHex, signature, publicKey);
};
