"use client";

import { WalletConnector } from "@/components/wallet-connector";
import { IdosClientProvider } from "@/idOS.provider";
import { getConfig, privyConfig, privyGeneralConfig } from "@/wagmi.config";
import { HeroUIProvider } from "@heroui/react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, useAccount } from "wagmi";

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

  return <IdosClientProvider>{props.children}</IdosClientProvider>;
}

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() => getConfig());
  return (
    <>
      <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID} config={privyGeneralConfig}>
        <HeroUIProvider>
          <QueryClientProvider client={queryClient}>
            {/* @ts-ignore */}
            <WagmiProvider config={privyConfig}>
              <Auth>{props.children}</Auth>
            </WagmiProvider>
          </QueryClientProvider>
        </HeroUIProvider>
      </PrivyProvider>
    </>
  );
}
