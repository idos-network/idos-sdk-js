import { type IssuerConfig, createIssuerConfig } from "@idos-network/issuer-sdk-js";
import { Wallet } from "ethers";
import invariant from "tiny-invariant";

let cachedIssuer: IssuerConfig | null = null;

export async function getIssuerConfig(): Promise<IssuerConfig> {
  if (cachedIssuer) {
    return cachedIssuer;
  }

  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const PRIVATE_KEY = process.env.NEXT_ISSUER_PRIVATE_KEY;
  const SECRET_KEY = process.env.NEXT_ISSUER_SECRET_KEY;

  invariant(NODE_URL, "`NEXT_PUBLIC_KWIL_NODE_URL` is not set");
  invariant(PRIVATE_KEY, "`NEXT_ISSUER_PRIVATE_KEY` is not set");
  invariant(SECRET_KEY, "`NEXT_ISSUER_SECRET_KEY` is not set");

  cachedIssuer = await createIssuerConfig({
    nodeUrl: NODE_URL,
    encryptionSecret: SECRET_KEY,
    signer: new Wallet(PRIVATE_KEY),
  });

  return cachedIssuer;
}
