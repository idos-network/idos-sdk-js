import { serve } from "@hono/node-server";
import { idOS } from "@idos-network/grantee-sdk-js";
import type { Grant } from "@idos-network/idos-sdk";
import { Hono } from "hono";
import type { FC } from "hono/jsx";
const app = new Hono();

const ENCRYPTION_SECRET_KEY = "2bu7SyMToRAuFn01/oqU3fx9ZHo9GKugQhQYmDuBXzg=";
const EVM_GRANTEE_PRIVATE_KEY =
  "0x515c2fed89c22eaa9d41cfce6e6e454fa0a39353e711d6a99f34b4ecab4b4859";
const EVM_NODE_URL = "https://ethereum-sepolia.publicnode.com";

const port = 8080;

const GrantsList: FC<{ grants?: Grant[] }> = (props: {
  grants?: Grant[];
}) => {
  if (!props.grants) return <div>No grants found</div>;

  return (
    <ul>
      {props.grants.map((grant) => {
        return <li key={grant.dataId}>{grant.dataId}</li>;
      })}
    </ul>
  );
};

async function start() {
  const idos = await idOS.init("EVM", EVM_GRANTEE_PRIVATE_KEY, ENCRYPTION_SECRET_KEY, EVM_NODE_URL);

  app.get("/", async (c) => {
    const grants = await idos.listGrants({
      owner: "0x32012817BEfd5Af5121Bdd9ebB2b0df786ADAe2e",
    });

    return c.html(<GrantsList grants={grants} />);
  });

  serve({
    fetch: app.fetch,
    port,
  });
}

start()
  .then(() => {
    console.log(`Server is running on port ${port}`);
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
  });
