import {
  generateSignInMessage as generateSignInMessageEth,
  verifySignInMessage as verifySignInMessageEth,
  verifyMessage as verifyMessageEth,
} from "./eth/utils";
import { verifyMessage as verifyMessageNear } from "./near/utils";
import { verifyMessage as verifyMessageStellar } from "./stellar/utils";
import { verifyMessage as verifyMessageXrp } from "./xrp/utils";

export const generateSignInMessage = (address: string, chain: string, url: URL): string => {
  if (chain === "eth") {
    return generateSignInMessageEth(address, chain, url);
  }

  // Other chains
  return `
Sign in with ${chain} to the app.
Address: ${address}
Chain: ${chain}
URI: ${url.toString()}
Version: 1
Chain ID: 1`;
};

export const verifySignInMessage = (
  chain: string,
  address: string,
  publicKey: string,
  message: string,
  signature: string,
): Promise<boolean> => {
  if (chain === "eth") {
    return verifySignInMessageEth(message, signature);
  }

  return verifyMessage(chain, address, publicKey, message, signature);
};

export const verifyMessage = (
  chain: string,
  address: string,
  publicKey: string,
  message: string,
  signature: string,
): Promise<boolean> => {
  if (chain === "eth") {
    return verifyMessageEth(address, message, signature);
  }

  if (chain === "stellar") {
    return verifyMessageStellar(address, message, signature);
  }

  if (chain === "xrp") {
    return verifyMessageXrp(address, publicKey, message, signature);
  }

  if (chain === "near") {
    return verifyMessageNear(address, publicKey, message, signature);
  }

  return Promise.resolve(false);
};
