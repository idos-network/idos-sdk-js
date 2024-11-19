import { routeTree } from "@/routeTree.gen";
import { getConfig } from "@/wagmi.config";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "@idos-network/ui-kit";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { WalletSelectorContextProvider } from "./contexts/near";

export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

createWeb3Modal({ wagmiConfig: getConfig(), projectId });

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(root).render(
  <StrictMode>
    <WagmiProvider config={getConfig()}>
      <ChakraProvider value={defaultSystem}>
        <WalletSelectorContextProvider>
          <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
            <ThemeProvider forcedTheme="dark">
              <RouterProvider router={router} />
            </ThemeProvider>
          </PersistQueryClientProvider>
        </WalletSelectorContextProvider>
      </ChakraProvider>
    </WagmiProvider>
  </StrictMode>,
);
