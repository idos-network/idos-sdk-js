import { deriveAddress } from 'xrpl';
import pkg from 'ripple-keypairs';
const {verify} = pkg;

export const verifySignInMessage = async (address: string, publicKey: string, message: string, signature: string): Promise<boolean> => {
  const derivedAddress = deriveAddress(publicKey);

  if (derivedAddress !== address) {
    // Invalid public key
    return false;
  }

  const messageBytes = Buffer.from(message, 'utf8').toString('hex')

  return verify(messageBytes, signature, publicKey);
};
