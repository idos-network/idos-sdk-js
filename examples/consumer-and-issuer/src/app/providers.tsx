"use client";

import { HeroUIProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type JSX, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { getConfig } from "@/wagmi.config";

export function Providers(props: {
  children: JSX.Element;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class">
        <WagmiProvider config={config} initialState={props.initialState}>
          <QueryClientProvider client={queryClient}>
            {props.children}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </WagmiProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
