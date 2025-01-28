"use client";

import { HeroUIProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider, useAccount } from "wagmi";

import { WalletConnector } from "@/components/wallet-connector";
import { IDOSProvider } from "@/idOS.provider";
import { getConfig } from "@/wagmi.config";

function Auth(props: { children: ReactNode }) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6">
        <h1 className="font-semibold text-2xl">Connect your wallet to continue</h1>
        <WalletConnector />
      </div>
    );
  }

  return <IDOSProvider>{props.children}</IDOSProvider>;
}

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <HeroUIProvider>
      <WagmiProvider config={config} initialState={props.initialState}>
        <QueryClientProvider client={queryClient}>
          <Auth>{props.children}</Auth>
        </QueryClientProvider>
      </WagmiProvider>
    </HeroUIProvider>
  );
}
