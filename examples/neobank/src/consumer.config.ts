import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

let cachedConsumer: idOSConsumerClass | null = null;

export async function idOSConsumer() {
  if (cachedConsumer) {
    return cachedConsumer;
  }
  invariant(process.env.IDOS_NODE_URL, "IDOS_NODE_URL is not set");
  invariant(process.env.IDOS_CONSUMER_SIGNER, "IDOS_CONSUMER_SIGNER is not set");
  invariant(
    process.env.IDOS_RECIPIENT_ENC_PRIVATE_KEY,
    "IDOS_RECIPIENT_ENC_PRIVATE_KEY is not set",
  );

  cachedConsumer = await idOSConsumerClass.init({
    nodeUrl: process.env.IDOS_NODE_URL,
    consumerSigner: nacl.sign.keyPair.fromSecretKey(
      Buffer.from(process.env.IDOS_CONSUMER_SIGNER, "base64"),
    ),
    recipientEncryptionPrivateKey: process.env.IDOS_RECIPIENT_ENC_PRIVATE_KEY,
  });
  return cachedConsumer;
}
