"use client";

import { HeroUIProvider } from "@heroui/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { type AppKitNetwork, mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit, useAppKitAccount } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { WalletConnector } from "@/components/wallet-connector";
import { IdosClientProvider } from "@/idOS.provider";

const queryClient = new QueryClient();

const metadata = {
  name: "ACME Card Provider",
  description: "ACME Card Provider",
  url: "https://acme-card-provider-demo.playground.idos.network/",
  icons: ["https://acme-card-provider-demo.playground.idos.network//static/logo.svg"],
};

const networks = [mainnet, sepolia];

export const wagmiAdapter = new WagmiAdapter({
  networks: networks as unknown as [AppKitNetwork, ...AppKitNetwork[]],
  projectId: process.env.NEXT_PUBLIC_APPKIT_PROJECT_ID ?? "",
  ssr: true,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as unknown as [AppKitNetwork, ...AppKitNetwork[]],
  projectId: process.env.NEXT_PUBLIC_APPKIT_PROJECT_ID ?? "",
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  showWallets: false,
});

export function AppKitProvider({
  children,
  initialState,
}: React.PropsWithChildren<{ initialState?: State }>) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

function Auth(props: { children: ReactNode }) {
  const { isConnected } = useAppKitAccount();

  if (!isConnected) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6">
        <h1 className="font-semibold text-2xl">Connect your wallet to continue</h1>
        <WalletConnector />
      </div>
    );
  }

  return <IdosClientProvider>{props.children}</IdosClientProvider>;
}

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <HeroUIProvider>
      <AppKitProvider initialState={props.initialState}>
        <QueryClientProvider client={queryClient}>
          <Auth>{props.children}</Auth>
        </QueryClientProvider>
      </AppKitProvider>
    </HeroUIProvider>
  );
}
