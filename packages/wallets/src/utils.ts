import {
  generateSignInMessage as generateSignInMessageEth,
  verifySignInMessage as verifySignInMessageEth,
} from "./eth/utils";
import { verifySignInMessage as verifySignInMessageNear } from "./near/utils";
import { verifySignInMessage as verifySignInMessageStellar } from "./stellar/utils";
import { verifySignInMessage as verifySignInMessageXrp } from "./xrp/utils";

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

  if (chain === "stellar") {
    return verifySignInMessageStellar(address, message, signature);
  }

  if (chain === "xrp") {
    return verifySignInMessageXrp(address, publicKey, message, signature);
  }

  if (chain === "near") {
    return verifySignInMessageNear(address, publicKey, message, signature);
  }

  return Promise.resolve(false);
};
