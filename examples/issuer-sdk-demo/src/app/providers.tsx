"use client";

import { NextUIProvider } from "@nextui-org/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { wagmiAdapter } from "@/wagmi.config";

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => wagmiAdapter.wagmiConfig);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <NextUIProvider>
      <WagmiProvider config={config} initialState={props.initialState}>
        <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
      </WagmiProvider>
    </NextUIProvider>
  );
}
