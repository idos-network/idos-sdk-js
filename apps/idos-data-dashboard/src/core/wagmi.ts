import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useMemo } from "react";
import type { Account, Client, Transport } from "viem";
import { useConnectorClient } from "wagmi";
import { type Chain, mainnet, sepolia } from "wagmi/chains";

export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

const metadata = {
  name: "idOS Dashboard",
  description: "idOS Dashboard",
  url: "https://dashboard.idos.network",
  icons: ["/idos-dashboard-logo.svg"],
};

export const chains = [mainnet, sepolia] as const;

export const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  return new JsonRpcSigner(provider, account.address);
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useConnectorClient({ chainId });
  return useMemo(() => (walletClient ? clientToSigner(walletClient) : undefined), [walletClient]);
}
