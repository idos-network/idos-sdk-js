import type { idOSClientLoggedIn } from "@idos-network/client";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Layout } from "@/components/layout";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    breadcrumb?: string;
  }
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  idOSClient: idOSClientLoggedIn;
}>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
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
