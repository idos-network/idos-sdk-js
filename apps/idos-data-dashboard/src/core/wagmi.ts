import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useMemo } from "react";
import { useConnectorClient } from "wagmi";

export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

const metadata = {
  name: "idOS Dashboard",
  description: "idOS Dashboard",
  url: "https://dashboard.idos.network",
  icons: ["/idos-dashboard-logo.svg"],
};

export const networks = [mainnet, sepolia];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sepolia], // for some reason it complains if u set this value to networks
  projectId,
  metadata,
  features: {
    allWallets: true,
    email: false,
    socials: false,
  },
});

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useConnectorClient({ chainId });
  const { caipNetwork } = useAppKitNetwork();
  const { address } = useAppKitAccount();

  const network = caipNetwork && {
    chainId: +caipNetwork?.id,
    name: caipNetwork?.name,
    ensAddress: caipNetwork?.contracts?.ensRegistry?.address as string,
  };

  const provider = walletClient && new BrowserProvider(walletClient.transport, network);
  const signer = useMemo(
    () => (provider && address ? new JsonRpcSigner(provider, address) : undefined),
    [provider],
  );
  return signer;
}
