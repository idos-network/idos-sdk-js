"use client";

import { HeroUIProvider } from "@heroui/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet } from "@reown/appkit/networks";
import { sepolia } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type JSX, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { NearWalletProvider } from "@/near.provider";

const queryClient = new QueryClient();

const metadata = {
  name: "NeoBank",
  description: "NeoBank",
  url: "https://consumer-and-issuer-demo.playground.idos.network/",
  icons: ["https://consumer-and-issuer-demo.playground.idos.network//static/logo.svg"],
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
    // @ts-ignore wagmi config is not typed for some reason
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export function Providers(props: {
  children: JSX.Element;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <HeroUIProvider>
      <NearWalletProvider>
        <AppKitProvider>
          <QueryClientProvider client={queryClient}>
            {props.children}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AppKitProvider>
      </NearWalletProvider>
    </HeroUIProvider>
  );
}
