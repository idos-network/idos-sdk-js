import { base64Decode } from "@idos-network/core";
import { type IssuerConfig, createIssuerConfig } from "@idos-network/issuer-sdk-js/server";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

let cachedIssuer: IssuerConfig | null = null;

export async function getIssuerConfig(): Promise<IssuerConfig> {
  if (cachedIssuer) {
    return cachedIssuer;
  }

  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const ENCRYPTION_SECRET_KEY = process.env.NEXT_ISSUER_ENCRYPTION_SECRET_KEY;
  const SIGNING_SECRET_KEY = process.env.NEXT_ISSUER_SIGNING_SECRET_KEY;

  invariant(NODE_URL, "`NEXT_PUBLIC_KWIL_NODE_URL` is not set");
  invariant(ENCRYPTION_SECRET_KEY, "`NEXT_ISSUER_ENCRYPTION_SECRET_KEY` is not set");
  invariant(SIGNING_SECRET_KEY, "`NEXT_ISSUER_SIGNING_SECRET_KEY` is not set");

  cachedIssuer = await createIssuerConfig({
    nodeUrl: NODE_URL,
    signingKeyPair: nacl.sign.keyPair.fromSecretKey(base64Decode(SIGNING_SECRET_KEY)),
    encryptionSecretKey: base64Decode(ENCRYPTION_SECRET_KEY),
  });

  return cachedIssuer;
}
