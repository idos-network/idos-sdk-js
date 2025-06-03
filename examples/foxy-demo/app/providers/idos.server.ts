import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import nacl from "tweetnacl";
import { COMMON_ENV } from "./envFlags.common";
import { SERVER_ENV } from "./envFlags.server";

export const idOSConsumer = await idOSConsumerClass.init({
  nodeUrl: COMMON_ENV.IDOS_NODE_URL,
  consumerSigner: nacl.sign.keyPair.fromSecretKey(
    Buffer.from(SERVER_ENV.IDOS_CONSUMER_SIGNER, "base64"),
  ),
  recipientEncryptionPrivateKey: SERVER_ENV.IDOS_RECIPIENT_ENC_PRIVATE_KEY,
});
