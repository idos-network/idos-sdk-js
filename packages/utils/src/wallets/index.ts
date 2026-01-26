// Address validation patterns
const EVM_REGEXP = /^0x[0-9a-fA-F]{40}$/;
const NEAR_REGEXP = /^[a-zA-Z0-9._-]+\.(near|testnet|betanet)$/;
const XRP_ADDRESS_REGEXP = /^r[0-9a-zA-Z]{24,34}$/;
const STELLAR_REGEXP = /^G[A-Z2-7]{55}$/;

export const getWalletType = (address: string): "evm" | "near" | "xrpl" | "stellar" => {
  if (EVM_REGEXP.test(address)) return "evm";
  if (NEAR_REGEXP.test(address)) return "near";
  if (XRP_ADDRESS_REGEXP.test(address)) return "xrpl";
  if (STELLAR_REGEXP.test(address)) return "stellar";
  throw new Error("Unsupported wallet address");
};
