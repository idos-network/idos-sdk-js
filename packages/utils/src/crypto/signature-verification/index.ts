import { getWalletType } from "../index";
import { verifyEvmSignature } from "./evm";
import { verifyNearSignature } from "./near";
import { verifyRippleSignature } from "./ripple";
import { verifyStellarSignature } from "./stellar";

export { verifyNearSignature };

export interface WalletSignature {
  address?: string;
  signature: string;
  message?: string;
  public_key: string[];
}

/**
 * Simple assertion function that throws an error if condition is false
 */
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export const verifySignature = async (walletPayload: WalletSignature): Promise<boolean> => {
  assert(walletPayload.address, "Wallet address is required");
  assert(walletPayload.message, "Wallet message is required");
  assert(walletPayload.signature, "Wallet signature is required");
  console.log({ walletPayload });

  try {
    const walletType = getWalletType(walletPayload.address);
    if (walletType === "evm")
      return verifyEvmSignature(
        walletPayload.message,
        walletPayload.signature as `0x${string}`,
        walletPayload.address as `0x${string}`,
      );
    if (walletType === "near")
      return verifyNearSignature(
        walletPayload.message,
        walletPayload.signature,
        walletPayload.public_key[0],
      );
    if (walletType === "xrpl")
      return verifyRippleSignature(
        walletPayload.message,
        walletPayload.signature,
        walletPayload.public_key[0],
      );
    if (walletType === "stellar")
      return await verifyStellarSignature(
        walletPayload.message,
        walletPayload.signature,
        walletPayload.public_key[0],
      );

    return false;
  } catch (error) {
    console.warn("Error verifying signature", error);
    return false;
  }
};
