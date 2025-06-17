import pkg from "ripple-keypairs";
import { deriveAddress } from "xrpl";
const { verify } = pkg;

export const verifyMessage = async (
  address: string,
  publicKey: string,
  message: string,
  signature: string,
): Promise<boolean> => {
  const derivedAddress = deriveAddress(publicKey);

  if (derivedAddress !== address) {
    // Invalid public key
    return false;
  }

  const messageBytes = Buffer.from(message, "utf8").toString("hex");

  return verify(messageBytes, signature, publicKey);
};
