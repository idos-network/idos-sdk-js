import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

export const chains = [mainnet, sepolia] as const;

export const injectedConnector = injected();

export const walletConnectConnector = walletConnect({
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
});

export function getConfig() {
  return createConfig({
    chains,
    connectors: [injectedConnector, walletConnectConnector],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
