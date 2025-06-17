import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import * as xrpKeypair from "ripple-keypairs";
import invariant from "tiny-invariant";

let cachedConsumer: idOSConsumerClass | null = null;

export async function idOSXrpConsumer() {
  if (cachedConsumer) {
    return cachedConsumer;
  }

  const seed = process.env.OTHER_CONSUMER_XRPL_SEED;
  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const OTHER_CONSUMER_ENCRYPTION_SECRET_KEY = process.env.OTHER_CONSUMER_ENCRYPTION_SECRET_KEY;

  invariant(NODE_URL, "NEXT_PUBLIC_KWIL_NODE_URL is not set");
  invariant(
    OTHER_CONSUMER_ENCRYPTION_SECRET_KEY,
    "OTHER_CONSUMER_ENCRYPTION_SECRET_KEY is not set",
  );
  invariant(seed, "OTHER_CONSUMER_XRPL_SEED is not set");

  const keyPair = xrpKeypair.deriveKeypair(seed);

  cachedConsumer = await idOSConsumerClass.init({
    nodeUrl: NODE_URL,
    consumerSigner: keyPair,
    recipientEncryptionPrivateKey: OTHER_CONSUMER_ENCRYPTION_SECRET_KEY,
  });
  return cachedConsumer;
}
