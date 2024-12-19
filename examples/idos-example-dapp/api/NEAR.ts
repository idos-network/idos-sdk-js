import { idOSGrantee } from "@idos-network/grantee-sdk-js";
import { KeyPair } from "near-api-js";

/* global crypto */
//@ts-ignore 🔨 to make it work locally and on Vercel.
if (!global.crypto) global.crypto = (await import("node:crypto")).default;

// These should be secrets and gotten from process.env, or wherever you keep your secrets.
const ENCRYPTION_SECRET_KEY = "2bu7SyMToRAuFn01/oqU3fx9ZHo9GKugQhQYmDuBXzg=";
const NEAR_GRANTEE_PRIVATE_KEY =
  "ed25519:35pK192Az9znHcMtHK2bGExuZV3QLRk5Ln1EpXpq4bf6FtU5twG4hneMqkzrGhARKdq54LavCFy9sprqemC72ZLs";

const nearGranteeSigner = KeyPair.fromString(NEAR_GRANTEE_PRIVATE_KEY);

const idosGrantee = await idOSGrantee.init({
  chainType: "NEAR",
  granteeSigner: nearGranteeSigner,
  recipientEncryptionPrivateKey: ENCRYPTION_SECRET_KEY,
});

const encryptionPublicKey = idosGrantee.encryptionPublicKey;
const lockTimeSpanSeconds = 3600; // one hour

import type { VercelRequest, VercelResponse } from "@vercel/node";
export default async function (request: VercelRequest, response: VercelResponse) {
  const requestMethod = request.method as string;

  if (requestMethod === "GET") {
    return response.json({
      encryptionPublicKey,
      lockTimeSpanSeconds,
      grantee: idosGrantee.grantee,
    });
  }

  if (requestMethod !== "POST") {
    return response.status(405).send("Only GETs and POSTs are supported.");
  }

  const rawBody = request.read();
  let body: ReturnType<typeof JSON.parse>;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return response.status(400).send(`Invalid body: ${new String(e)}`);
  }
  if (!body.dataId) {
    return response.status(400).send("POSTs must send a JSON object with a 'dataId' field.");
  }

  const { dataId } = body as { dataId: string };
  try {
    return response.json(await idosGrantee.getSharedCredentialContentDecrypted(dataId));
  } catch (e) {
    console.error(e);
    return response.status(500).send(e.toString());
  }
}
