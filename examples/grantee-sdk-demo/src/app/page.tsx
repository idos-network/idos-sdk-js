import { idOSGranteeSDK } from "@idos-network/grantee-sdk-js";

const ENCRYPTION_SECRET_KEY =
  process.env.ENCRYPTION_SECRET_KEY ?? "j7IppyTqzOfKQ7PuF/lx7HpoDZBbiO2Jrdx1gYN/+8M=";
const EVM_GRANTEE_PRIVATE_KEY =
  process.env.EVM_GRANTEE_PRIVATE_KEY ??
  "625d65aa6e91825b6f31fa90f4ae55ccb2051ff16b0c6574bad89ee98382be32";
const GRANTEE_ADDRESS = process.env.OWNER_ADDRESS ?? "0x8Bf421D4fe039000981ee77163eF777718af68e3";
const NODE_URL = process.env.EVM_NODE_URL ?? "https://nodes.playground.idos.network";
const dbId = process.env.DB_ID ?? "";

export default async function Home() {
  if (!ENCRYPTION_SECRET_KEY || !EVM_GRANTEE_PRIVATE_KEY || !GRANTEE_ADDRESS || !NODE_URL) {
    throw new Error("Missing environment variables for Grantee SDK Demo");
  }

  const sdk = await idOSGranteeSDK.init(
    "EVM",
    EVM_GRANTEE_PRIVATE_KEY,
    ENCRYPTION_SECRET_KEY,
    NODE_URL,
    dbId,
  );
  const data = (await sdk.listGrants(1, 10)) || [];

  return (
    <div className="grid h-dvh place-content-center gap-4">
      <h1 className="font-semibold text-2xl">Grantee SDK Demo</h1>
      <p>
        Listing first 10 grant ID's for Grantee <span className="font-mono">{GRANTEE_ADDRESS}</span>
      </p>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th>Grant ID</th>
            <th>owner ID</th>
          </tr>
        </thead>
        <tbody>
          {data.grants.map((grant) => (
            <tr key={grant.dataId}>
              <td>{grant.dataId}</td>
              <td>{grant.ownerUserId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
