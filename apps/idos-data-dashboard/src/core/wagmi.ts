import { defaultWagmiConfig } from "@web3modal/wagmi/react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useMemo } from "react";
import { type WalletClient, useWalletClient } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

const metadata = {
  name: "idOS Dashboard",
  description: "idOS Dashboard",
  url: "https://dashboard.idos.network",
  icons: ["/idos-dashboard-logo.svg"]
};

export const chains = [import.meta.env.DEV ? sepolia : mainnet];

export const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  return useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient]
  );
}
