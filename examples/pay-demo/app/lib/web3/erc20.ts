export const erc20Abi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export type SupportedToken = "USDT0" | "USDC0" | "POL";

// Known token decimals on Polygon
export const TOKEN_INFO: Record<
  SupportedToken,
  { address: string; decimals: number; isNative?: boolean; noahDepositAddress?: string }
> = {
  // USDT on Polygon
  USDT0: {
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6,
    noahDepositAddress: "0xEaF1bDaDE2c20672C46FD5d38BA42AAD9bdd99E1",
  },
  USDC0: {
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
    noahDepositAddress: "0xEaF1bDaDE2c20672C46FD5d38BA42AAD9bdd99E1",
  },
  // POL (Polygon native token)
  POL: {
    address: "0x0000000000000000000000000000000000000000", // Native token address
    decimals: 18,
    isNative: true,
    noahDepositAddress: "0xEaF1bDaDE2c20672C46FD5d38BA42AAD9bdd99E1",
  },
} as const;

export const getNoahDepositAddress = (tokenId: SupportedToken) => {
  return TOKEN_INFO[tokenId]?.noahDepositAddress;
};
