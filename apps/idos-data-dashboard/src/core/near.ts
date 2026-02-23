import { NearConnector } from "@hot-labs/near-connect";

// const contractId = import.meta.env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID;

const isTestnet = (import.meta.env.VITE_NEAR_NETWORK as "testnet" | "mainnet") === "testnet";

export const connector = new NearConnector({
  features: isTestnet ? { testnet: true } : undefined,
  logger: {
    log: (message: string) => {
      console.log(message);
    },
  },
});
