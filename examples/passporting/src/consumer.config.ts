import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import { hexDecode } from "@idos-network/core";
import { KeyPair } from "near-api-js";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

const pk =
  "ed25519:4wXwFh42EiEAcz1cBUs4KANLAULpF5UVg5ozbHYtkGZNzJASm7ZAKAwxobY5KknqgtZGKgkAwbUuvQmDsciANpe3";

let cachedConsumer: idOSConsumerClass | null = null;

export async function idOSConsumer() {
  if (cachedConsumer) {
    return cachedConsumer;
  }

  const kp = KeyPair.fromString(pk);

  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const ENCRYPTION_SECRET_KEY = process.env.CONSUMER_ENCRYPTION_SECRET_KEY;
  const SIGNING_SECRET_KEY = process.env.CONSUMER_SIGNING_SECRET_KEY;

  invariant(NODE_URL, "NEXT_PUBLIC_KWIL_NODE_URL is not set");
  invariant(ENCRYPTION_SECRET_KEY, "CONSUMER_ENCRYPTION_SECRET_KEY is not set");
  invariant(SIGNING_SECRET_KEY, "CONSUMER_SIGNING_SECRET_KEY is not set");

  cachedConsumer = await idOSConsumerClass.init({
    nodeUrl: NODE_URL,
    consumerSigner: kp,
    recipientEncryptionPrivateKey: ENCRYPTION_SECRET_KEY,
  });

  return cachedConsumer;
}
