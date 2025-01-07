import { idOS } from "@idos-network/grantee-sdk-js";

const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY ?? "";
const EVM_GRANTEE_PRIVATE_KEY = process.env.EVM_GRANTEE_PRIVATE_KEY ?? "";
const GRANTEE_ADDRESS = process.env.OWNER_ADDRESS ?? "";
const NODE_URL = process.env.EVM_NODE_URL ?? "";
const dbId = process.env.DB_ID ?? "";

export default async function Home() {
  if (!ENCRYPTION_SECRET_KEY || !EVM_GRANTEE_PRIVATE_KEY || !GRANTEE_ADDRESS || !NODE_URL) {
    throw new Error("Missing environment variables for Grantee SDK Demo");
  }

  const sdk = await idOS.init(
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
