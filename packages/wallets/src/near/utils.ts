import crypto from "node:crypto";
import { connect, keyStores, utils } from "near-api-js";

async function verifyPublicKeyForAccount(accountId: string, publicKeyToCheck: string) {
  const keyStore = new keyStores.InMemoryKeyStore();
  const near = await connect({
    networkId: "testnet",
    nodeUrl: "https://test.rpc.fastnear.com",
    deps: { keyStore },
  });

  const account = await near.account(accountId);
  const accessKeys = await account.getAccessKeys();

  return accessKeys.some((key) => key.public_key === publicKeyToCheck);
}

export const verifyMessage = async (
  address: string,
  publicKey: string,
  message: string,
  signature: string,
): Promise<boolean> => {
  const keyPair = utils.key_pair.KeyPair.fromString(publicKey);
  const messageBytes = crypto.createHash("sha256").update(message).digest();

  // Check accountId & publicKey match
  const keyMatches = await verifyPublicKeyForAccount(address, publicKey);

  if (!keyMatches) {
    return false;
  }

  return keyPair.verify(messageBytes, Buffer.from(signature, "base64"));
};
