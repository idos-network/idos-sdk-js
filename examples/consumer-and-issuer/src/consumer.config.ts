import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer-sdk-js/server";
import { hexDecode } from "@idos-network/core";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

let cachedConsumer: idOSConsumerClass | null = null;

export async function getConsumerConfig() {
  if (cachedConsumer) {
    return cachedConsumer;
  }

  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const ENCRYPTION_SECRET_KEY = process.env.CONSUMER_ENCRYPTION_SECRET_KEY;
  const SIGNING_SECRET_KEY = process.env.CONSUMER_SIGNING_SECRET_KEY;

  invariant(NODE_URL, "NEXT_PUBLIC_KWIL_NODE_URL is not set");
  invariant(ENCRYPTION_SECRET_KEY, "CONSUMER_ENCRYPTION_SECRET_KEY is not set");
  invariant(SIGNING_SECRET_KEY, "CONSUMER_SIGNING_SECRET_KEY is not set");

  cachedConsumer = await idOSConsumerClass.init({
    nodeUrl: NODE_URL,
    consumerSigner: nacl.sign.keyPair.fromSecretKey(hexDecode(SIGNING_SECRET_KEY)),
    recipientEncryptionPrivateKey: ENCRYPTION_SECRET_KEY,
  });

  return cachedConsumer;
}
