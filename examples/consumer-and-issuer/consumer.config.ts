import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer-sdk-js/server";
import { hexDecode } from "@idos-network/core";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

let cachedConsumer: idOSConsumerClass | null = null;

export async function idOSConsumer() {
  if (cachedConsumer) {
    return cachedConsumer;
  }

  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const INTEGRATED_CONSUMER_ENCRYPTION_SECRET_KEY =
    process.env.INTEGRATED_CONSUMER_ENCRYPTION_SECRET_KEY;
  const INTEGRATED_CONSUMER_SIGNING_SECRET_KEY = process.env.INTEGRATED_CONSUMER_SIGNING_SECRET_KEY;

  invariant(NODE_URL, "NEXT_PUBLIC_KWIL_NODE_URL is not set");
  invariant(
    INTEGRATED_CONSUMER_ENCRYPTION_SECRET_KEY,
    "INTEGRATED_CONSUMER_ENCRYPTION_SECRET_KEY is not set",
  );
  invariant(
    INTEGRATED_CONSUMER_SIGNING_SECRET_KEY,
    "INTEGRATED_CONSUMER_SIGNING_SECRET_KEY is not set",
  );

  cachedConsumer = await idOSConsumerClass.init({
    nodeUrl: NODE_URL,
    consumerSigner: nacl.sign.keyPair.fromSecretKey(
      hexDecode(INTEGRATED_CONSUMER_SIGNING_SECRET_KEY),
    ),
    recipientEncryptionPrivateKey: INTEGRATED_CONSUMER_ENCRYPTION_SECRET_KEY,
  });

  return cachedConsumer;
}
