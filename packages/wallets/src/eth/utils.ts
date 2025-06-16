import { SiweMessage } from "siwe";
import { getAddress } from "ethers";

export const generateSignInMessage = (address: string, chain: string, url: URL): string => {
  return new SiweMessage({
    domain: url.hostname,
    address: getAddress(address),
    statement: "Sign in with Ethereum to the app.",
    uri: url.toString(),
    version: "1",
    chainId: 1,
  }).prepareMessage();
};

export const verifySignInMessage = async (message: string, signature: string): Promise<boolean> => {
  const siweMessage = new SiweMessage(message);
  const isValid = await siweMessage.verify({ signature });
  return isValid.success;
}
