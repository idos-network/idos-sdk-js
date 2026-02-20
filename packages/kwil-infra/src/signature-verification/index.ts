import invariant from "tiny-invariant";
import type { WalletType } from "../actions";
import { verifyNearSignature } from "../near/signature-verification";
import { verifyRippleSignature } from "../xrp/signature-verification";
import { verifyEvmSignature } from "./evm";
import { verifyFaceSignSignature } from "./facesign";
import { verifyStellarSignature } from "./stellar";

export interface WalletSignature {
  address: string;
  signature: string;
  message: string;
  wallet_type: WalletType;
  public_key?: string[];
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
          // @ts-expect-error - this has been checked above
          walletPayload.public_key[0],
        );
      case "XRPL":
        return verifyRippleSignature(
          walletPayload.message,
          walletPayload.signature,
          // @ts-expect-error - this has been checked above
          walletPayload.public_key[0],
        );
      case "Stellar":
        return await verifyStellarSignature(
          walletPayload.message,
          walletPayload.signature,
          // @ts-expect-error - this has been checked above
          walletPayload.public_key[0],
        );
      case "FaceSign":
        return verifyFaceSignSignature(
          walletPayload.message,
          walletPayload.signature,
          // @ts-expect-error - this has been checked above
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
