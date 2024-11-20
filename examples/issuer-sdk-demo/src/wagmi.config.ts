import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useMemo } from "react";
import { useConnectorClient } from "wagmi";

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string;

const metadata = {
  name: "idOS Issuer Demo",
  description: "idOS Issuer Demo",
  url: "https://issuer-sdk-demo.vercel.app/",
  icons: [],
};

export const networks = [mainnet, sepolia];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
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
