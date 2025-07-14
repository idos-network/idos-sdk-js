import invariant from "tiny-invariant";
import { verifyEvmSignature } from "./evm";
import { verifyNearSignature } from "./near";
import { verifyRippleSignature } from "./ripple";
import { verifyStellarSignature } from "./stellar";

export interface WalletSignature {
  address?: string;
  signature: string;
  message?: string;
  public_key: string[];
}

const getWalletType = (walletPayload: WalletSignature): "evm" | "near" | "xrpl" | "stellar" => {
  // Address validation patterns
  const evm_regexp = /^0x[0-9a-fA-F]{40}$/;
  const near_regexp = /^[a-zA-Z0-9._-]+\.(near|testnet|betanet)$/;
  const xrp_address_regexp = /^r[0-9a-zA-Z]{24,34}$/;
  const stellar_regexp = /^G[A-Z0-9]{55}$/;

  if (evm_regexp.test(walletPayload.address ?? "")) return "evm";
  if (near_regexp.test(walletPayload.address ?? "")) return "near";
  if (xrp_address_regexp.test(walletPayload.address ?? "")) return "xrpl";
  if (stellar_regexp.test(walletPayload.address ?? "")) return "stellar";
  throw new Error("Unsupported wallet address");
};

export const verifySignature = async (walletPayload: WalletSignature): Promise<boolean> => {
  invariant(walletPayload.address, "Wallet address is required");
  invariant(walletPayload.message, "Wallet message is required");
  invariant(walletPayload.signature, "Wallet signature is required");
  console.log("walletPayload", walletPayload);
  try {
    const walletType = getWalletType(walletPayload);
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
      return true; // TODO: remove this
    // await verifyStellarSignature(
    //     walletPayload.message,
    //     walletPayload.signature,
    //     walletPayload.public_key[0],
    //   );

    return false;
  } catch (error) {
    console.warn("Error verifying signature", error);
    return false;
  }
};
