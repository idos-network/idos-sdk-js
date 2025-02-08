import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const chains = [mainnet, sepolia] as const;

export const injectedConnector = injected();

export function getConfig() {
  return createConfig({
    chains,
    connectors: [injectedConnector],
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
