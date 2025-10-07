export const getWalletType = (address: string): "evm" | "near" | "xrpl" | "stellar" => {
  // Address validation patterns
  const evm_regexp = /^0x[0-9a-fA-F]{40}$/;
  const near_regexp = /^[a-zA-Z0-9._-]+\.(near|testnet|betanet)$/;
  const xrp_address_regexp = /^r[0-9a-zA-Z]{24,34}$/;
  const stellar_regexp = /^G[A-Z0-9]{55}$/;

  if (evm_regexp.test(address)) return "evm";
  if (near_regexp.test(address)) return "near";
  if (xrp_address_regexp.test(address)) return "xrpl";
  if (stellar_regexp.test(address)) return "stellar";
  throw new Error("Unsupported wallet type");
};
