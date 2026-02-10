import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import Layout from "@/components/layout";
import { IDOSClientProvider, useUnsafeIdOS } from "@/idOS.provider";
import "@/styles/index.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <IDOSClientProvider>
        <LayoutWrapper />
      </IDOSClientProvider>
      {!import.meta.env.DEV && (
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      )}
    </>
  );
}

function LayoutWrapper() {
  const idOSClient = useUnsafeIdOS();
  const hasAccount = idOSClient.state === "logged-in" && !!idOSClient.user?.id;

  return (
    <Layout hasAccount={hasAccount}>
      <Outlet />
    </Layout>
  );
}
