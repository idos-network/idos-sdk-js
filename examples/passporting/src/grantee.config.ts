import { base64Decode } from "@idos-network/codecs";
import { idOSGrantee } from "@idos-network/grantee-sdk-js";
import nacl from "tweetnacl";

let granteeConfig: idOSGrantee | null = null;

export const createGranteeSdkInstance = async () => {
  if (granteeConfig) {
    return granteeConfig;
  }
  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const ENCRYPTION_SECRET_KEY = process.env.NEXT_PUBLIC_GRANTEE_ENCRYPTION_SECRET_KEY;
  const SIGNING_SECRET_KEY = process.env.NEXT_GRANTEE_SIGNING_SECRET_KEY ?? "";

  if (!NODE_URL || !ENCRYPTION_SECRET_KEY || !SIGNING_SECRET_KEY) {
    throw new Error("Missing environment variables");
  }

  granteeConfig = await idOSGrantee.init({
    granteeSigner: nacl.sign.keyPair.fromSecretKey(base64Decode(SIGNING_SECRET_KEY)),
    recipientEncryptionPrivateKey: ENCRYPTION_SECRET_KEY,
    nodeUrl: NODE_URL,
  });
  return granteeConfig;
};
