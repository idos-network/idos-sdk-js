import { createFileRoute, Outlet } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { useIdOS } from "@/idOS.provider";

export const Route = createFileRoute("/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const idOSClient = useIdOS();

  return (
    <Layout hasAccount={idOSClient.state === "logged-in" && !!idOSClient.user?.id}>
      <Outlet />
    </Layout>
  );
}
