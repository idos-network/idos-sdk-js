import type { idOSClientLoggedIn } from "@idos-network/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useSelector } from "@xstate/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";

import "@/machines/dashboard.actor";
import { ErrorCard } from "@/components/error-card";
import { Layout } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { ConnectWallet } from "@/connect-wallet";
import { wagmiAdapter } from "@/core/wagmi";
import { dashboardActor } from "@/machines/dashboard.actor";
import {
  selectIsDisconnected,
  selectIsLoading,
  selectIsNoProfile,
  selectLoggedInClient,
} from "@/machines/selectors";
import { queryClient } from "@/query-client";
import { routeTree } from "./routeTree.gen";
import "@/styles/index.css";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: ErrorCard,
  context: {
    queryClient,
    // The actual idOSClient instance is injected at runtime via <RouterProvider context={...} />,
    // which only mounts after authentication completes. This placeholder satisfies the type system.
    idOSClient: undefined as unknown as idOSClientLoggedIn,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const isLoading = useSelector(dashboardActor, selectIsLoading);
  const isDisconnected = useSelector(dashboardActor, selectIsDisconnected);
  const isNoProfile = useSelector(dashboardActor, selectIsNoProfile);
  const idOSClient = useSelector(dashboardActor, selectLoggedInClient);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (isDisconnected) {
    return <ConnectWallet />;
  }

  if (isNoProfile) {
    return (
      <Layout>
        <span className="block font-medium text-sm">No account found</span>
      </Layout>
    );
  }

  if (!idOSClient) {
    return null;
  }

  return <RouterProvider router={router} context={{ queryClient, idOSClient }} />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="bottom-right" duration={3000} />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
