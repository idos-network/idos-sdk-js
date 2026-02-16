import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useSelector } from "@xstate/react";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    breadcrumb?: string;
  }
}

import { Layout } from "@/components/layout";
import { Spinner } from "@/components/ui/spinner";
import { ConnectWallet } from "@/connect-wallet";
import { dashboardActor } from "@/machines/dashboard.actor";
import { selectIsDisconnected, selectIsLoading, selectIsNoProfile } from "@/machines/selectors";
import "@/styles/index.css";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
});

function AppContent() {
  const isLoading = useSelector(dashboardActor, selectIsLoading);
  const isDisconnected = useSelector(dashboardActor, selectIsDisconnected);
  const isNoProfile = useSelector(dashboardActor, selectIsNoProfile);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (isDisconnected) return <ConnectWallet />;

  if (isNoProfile) {
    return (
      <Layout>
        <span className="text-sm font-medium block">No account found</span>
      </Layout>
    );
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function RootComponent() {
  return (
    <>
      <AppContent />
      <TanStackDevtools
        config={{ position: "bottom-right" }}
        plugins={[
          { name: "React Query", render: <ReactQueryDevtoolsPanel /> },
          { name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> },
        ]}
      />
    </>
  );
}
