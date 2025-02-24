import { idOSGrantee } from "@idos-network/consumer-sdk-js";
import { base64Decode } from "@idos-network/core";
import nacl from "tweetnacl";

const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY ?? "";
const GRANTEE_ADDRESS = process.env.OWNER_ADDRESS ?? "";
const NODE_URL = process.env.EVM_NODE_URL ?? "";
const dbId = process.env.DB_ID ?? "";
const SIGNING_SECRET_KEY = process.env.NEXT_ISSUER_SIGNING_SECRET_KEY ?? "";

export default async function Home() {
  if (process.env.NEXT_IS_EXPORT_WORKER === "true") return null;

  if (!ENCRYPTION_SECRET_KEY || !GRANTEE_ADDRESS || !NODE_URL) {
    throw new Error("Missing environment variables for Grantee SDK Demo");
  }

  const sdk = await idOSGrantee.init({
    granteeSigner: nacl.sign.keyPair.fromSecretKey(base64Decode(SIGNING_SECRET_KEY)),
    recipientEncryptionPrivateKey: ENCRYPTION_SECRET_KEY,
    nodeUrl: NODE_URL,
    dbId: dbId,
  });
  const data = (await sdk.getGrants(1, 10)) || [];

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
