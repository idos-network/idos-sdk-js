import invariant from "tiny-invariant";
import { verifyEvmSignature } from "./evm";
import { verifyNearSignature } from "./near";
import { verifyRippleSignature } from "./ripple";
import { verifyStellarSignature } from "./stellar";

export { verifyNearSignature };

export interface WalletSignature {
  address?: string;
  signature: string;
  message?: string;
  // TODO: This is a copy & paste from core, this should be resolved when @core disappears
  wallet_type: "EVM" | "NEAR" | "XRPL" | "Stellar" | "Pinocchio";
  public_key: string[];
}

export const verifySignature = async (walletPayload: WalletSignature): Promise<boolean> => {
  invariant(walletPayload.address, "Wallet address is required");
  invariant(walletPayload.message, "Wallet message is required");
  invariant(walletPayload.signature, "Wallet signature is required");
  invariant(walletPayload.wallet_type, "Wallet type is required");

  if (walletPayload.wallet_type !== "EVM") {
    invariant(walletPayload.public_key?.[0], "Wallet public_key is required for non-EVM wallets");
  }

  try {
    switch (walletPayload.wallet_type) {
      case "EVM":
        return verifyEvmSignature(
          walletPayload.message,
          walletPayload.signature as `0x${string}`,
          walletPayload.address as `0x${string}`,
        );
      case "NEAR":
        return verifyNearSignature(
          walletPayload.message,
          walletPayload.signature,
          walletPayload.public_key[0],
        );
      case "XRPL":
        return verifyRippleSignature(
          walletPayload.message,
          walletPayload.signature,
          walletPayload.public_key[0],
        );
      case "Stellar":
        return await verifyStellarSignature(
          walletPayload.message,
          walletPayload.signature,
          walletPayload.public_key[0],
        );
      default:
        throw new Error(`Unsupported wallet type: ${walletPayload.wallet_type}`);
    }
  } catch (error) {
    console.warn("Error verifying signature", error);
    return false;
  }
};
