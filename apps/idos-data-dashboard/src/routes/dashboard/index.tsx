import { Outlet } from "react-router-dom";
import Layout from "@/components/layout";

import { useIdOS } from "@/idOS.provider";

export function Component() {
  const idOSClient = useIdOS();

  return (
    <Layout hasAccount={idOSClient.state === "logged-in" && !!idOSClient.user?.id}>
      <Outlet />
    </Layout>
  );
}
