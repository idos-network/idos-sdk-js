import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { type AppKitNetwork, mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit, useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { WagmiProvider } from "wagmi";

const projectId = "b56e18d47c72ab683b10814fe9495694";

const networks = [mainnet, sepolia];

const metadata = {
  name: "Wallet Connector Playground",
  description: "Wallet Connector Playground",
  url: "",
  icons: [],
};

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as unknown as [AppKitNetwork, ...AppKitNetwork[]],
  metadata,
  projectId,
});

const queryClient = new QueryClient();

export function AppKitProvider({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export function useAppKitWallet() {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  return {
    address,
    isConnected,
    isConnecting: status === "connecting",
    connect: () => open(),
    disconnect,
  };
}
