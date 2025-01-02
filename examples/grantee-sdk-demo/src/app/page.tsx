import { idOS } from "@idos-network/grantee-sdk-js";

const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY;
const EVM_GRANTEE_PRIVATE_KEY = process.env.EVM_GRANTEE_PRIVATE_KEY;
const OWNER_ADDRESS = process.env.OWNER_ADDRESS;
const EVM_NODE_URL = "https://ethereum-sepolia.publicnode.com";

export default async function Home() {
  if (!ENCRYPTION_SECRET_KEY || !EVM_GRANTEE_PRIVATE_KEY || !OWNER_ADDRESS || !EVM_NODE_URL) {
    throw new Error("Missing environment variables for Grantee SDK Demo");
  }

  const sdk = await idOS.init("EVM", EVM_GRANTEE_PRIVATE_KEY, ENCRYPTION_SECRET_KEY, EVM_NODE_URL);
  const grants = await sdk.listGrants({
    ownerAddress: OWNER_ADDRESS,
  });

  return (
    <div className="grid h-dvh place-content-center gap-4">
      <h1 className="font-semibold text-2xl">Grantee SDK Demo</h1>
      <p>
        Listing grant ID's for owner <span className="font-mono">{OWNER_ADDRESS}</span>:
      </p>
      <ul className="flex list-outside list-disc flex-col gap-2 font-mono">
        {grants?.map((grant) => (
          <li key={grant.dataId}>{grant.dataId}</li>
        ))}
      </ul>
    </div>
  );
}
