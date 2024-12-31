import { idOS } from "@idos-network/grantee-sdk-js";

const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY ?? "";
const EVM_GRANTEE_PRIVATE_KEY = process.env.EVM_GRANTEE_PRIVATE_KEY ?? "";
const OWNER_ADDRESS = process.env.OWNER_ADDRESS;
const EVM_NODE_URL = "https://nodes.playground.idos.network";
const dbId = "x2eb42160d1f2414213163901610123089b41d49be7c3d7d7012205e2";

export default async function Home() {
  if (!ENCRYPTION_SECRET_KEY) {
    throw new Error("Missing environment variables for Grantee SDK Demo");
  }

  const sdk = await idOS.init(
    "EVM",
    EVM_GRANTEE_PRIVATE_KEY,
    ENCRYPTION_SECRET_KEY,
    EVM_NODE_URL,
    dbId,
  );
  const grants = await sdk.listGrants(1, 10);

  return (
    <div className="grid h-dvh place-content-center gap-4">
      <h1 className="font-semibold text-2xl">Grantee SDK Demo</h1>
      <p>
        Listing grant ID's for owner <span className="font-mono">{OWNER_ADDRESS}</span>:
      </p>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th>Grant ID</th>
            <th>owner ID</th>
          </tr>
        </thead>
        <tbody>
          {grants.grants.map((grant) => (
            <tr key={crypto.randomUUID()}>
              <td>{grant.dataId}</td>
              <td>{grant.ownerUserId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
