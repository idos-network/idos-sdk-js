// Network configuration mapping
const NEAR_NETWORKS = {
  mainnet: {
    networkId: "mainnet",
    nodeUrl: "https://rpc.mainnet.near.org",
  },
  testnet: {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
  },
  betanet: {
    networkId: "betanet",
    nodeUrl: "https://rpc.betanet.near.org",
  },
  shardnet: {
    networkId: "shardnet",
    nodeUrl: "https://rpc.shardnet.near.org",
  },
} as const;

// Function to detect NEAR network from account ID
export const detectNearNetwork = (accountId: string): keyof typeof NEAR_NETWORKS => {
  if (accountId.endsWith(".near")) return "mainnet";
  if (accountId.endsWith(".testnet")) return "testnet";
  if (accountId.endsWith(".betanet")) return "betanet";
  if (accountId.endsWith(".shardnet")) return "shardnet";

  // Default to testnet for development, mainnet for production
  return "testnet";
};

// Function to get connection config based on account ID
export const getNearNodeUrl = (accountId: string): string => {
  const network = detectNearNetwork(accountId);
  const networkConfig = NEAR_NETWORKS[network];

  return networkConfig.nodeUrl;
};
