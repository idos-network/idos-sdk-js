import { hexDecode } from "@idos-network/codecs";
import { idOSGrantee as idOSGranteeClass } from "@idos-network/grantee-sdk-js";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

let cachedGrantee: idOSGranteeClass | null = null;

export async function idOSGrantee() {
  if (cachedGrantee) {
    return cachedGrantee;
  }

  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const ENCRYPTION_SECRET_KEY = process.env.GRANTEE_ENCRYPTION_SECRET_KEY;
  const SIGNING_SECRET_KEY = process.env.GRANTEE_SIGNING_SECRET_KEY;

  invariant(NODE_URL, "NEXT_PUBLIC_KWIL_NODE_URL is not set");
  invariant(ENCRYPTION_SECRET_KEY, "GRANTEE_ENCRYPTION_SECRET_KEY is not set");
  invariant(SIGNING_SECRET_KEY, "GRANTEE_SIGNING_SECRET_KEY is not set");

  cachedGrantee = await idOSGranteeClass.init({
    nodeUrl: NODE_URL,
    granteeSigner: nacl.sign.keyPair.fromSecretKey(hexDecode(SIGNING_SECRET_KEY)),
    recipientEncryptionPrivateKey: ENCRYPTION_SECRET_KEY,
  });

  return cachedGrantee;
}
