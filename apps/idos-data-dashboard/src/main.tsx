import type { idOSClientLoggedIn } from "@idos-network/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useSelector } from "@xstate/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";

import "@/machines/dashboard.actor";
import { LogOutIcon } from "lucide-react";
import { ErrorCard } from "@/components/error-card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { ConnectWallet } from "@/connect-wallet";
import { wagmiAdapter } from "@/core/wagmi";
import { dashboardActor } from "@/machines/dashboard.actor";
import {
  selectError,
  selectIsConnectingFaceSign,
  selectIsDisconnected,
  selectIsError,
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
  const isConnectingFaceSign = useSelector(dashboardActor, selectIsConnectingFaceSign);
  const isDisconnected = useSelector(dashboardActor, selectIsDisconnected);
  const isNoProfile = useSelector(dashboardActor, selectIsNoProfile);
  const isError = useSelector(dashboardActor, selectIsError);
  const error = useSelector(dashboardActor, selectError);
  const idOSClient = useSelector(dashboardActor, selectLoggedInClient);

  if (isLoading || isConnectingFaceSign) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Spinner className="size-8" />
        <p className="text-center text-muted-foreground text-sm">Loading</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
        <p className="max-w-md text-center text-destructive text-lg">
          {error || "Something went wrong"}
        </p>
        <div className="flex gap-4">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => dashboardActor.send({ type: "RETRY" })}
          >
            Retry
          </Button>
          <Button
            size="lg"
            onClick={() => dashboardActor.send({ type: "DISCONNECT" })}
            className="flex items-center gap-2"
          >
            <LogOutIcon size={20} />
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  if (isDisconnected) {
    return <ConnectWallet />;
  }

  if (isNoProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
        <img
          src="/logo-light.svg"
          alt="idOS logo"
          width={160}
          height={52}
          className="h-auto w-40 dark:hidden"
        />
        <img
          src="/logo.svg"
          alt="idOS logo"
          width={160}
          height={52}
          className="hidden h-auto w-40 dark:block"
        />
        <p className="text-foreground text-xl">No idOS account found for the connected wallet</p>
        <Button
          size="lg"
          onClick={() => dashboardActor.send({ type: "DISCONNECT" })}
          className="flex items-center gap-2"
        >
          <LogOutIcon size={20} />
          Disconnect wallet
        </Button>
      </div>
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
        <Toaster position="bottom-right" duration={3000} />
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
