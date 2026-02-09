import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";

import { Toaster } from "@/components/ui/sonner";
import { WalletSelectorContextProvider } from "@/core/near";
import { projectId, wagmiConfig } from "@/core/wagmi";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

createWeb3Modal({ wagmiConfig, projectId });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletSelectorContextProvider>
      {/* @ts-ignore: TODO: fix wagmi types */}
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Toaster position="bottom-center" />
          <RouterProvider router={router} />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </QueryClientProvider>
      </WagmiProvider>
    </WalletSelectorContextProvider>
  </React.StrictMode>,
);
