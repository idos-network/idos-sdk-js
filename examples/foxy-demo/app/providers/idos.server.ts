import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import nacl from "tweetnacl";
import { COMMON_ENV } from "./envFlags.common";
import { SERVER_ENV } from "./envFlags.server";

export async function getSharedCredential(credentialId: string, inserterId: string) {
  const idOSConsumer = await idOSConsumerClass.init({
    nodeUrl: COMMON_ENV.IDOS_NODE_URL,
    consumerSigner: nacl.sign.keyPair.fromSecretKey(
      Buffer.from(SERVER_ENV.IDOS_CONSUMER_SIGNER, "base64"),
    ),
    recipientEncryptionPrivateKey: SERVER_ENV.IDOS_RECIPIENT_ENC_PRIVATE_KEY,
  });

  const grant = await idOSConsumer.getAccessGrantsForCredential(credentialId);

  // @ts-expect-error Missing types
  if (!grant || grant.inserter_id !== inserterId) {
    throw new Error("Grant not found.");
  }

  // Get data
  const credentialContents: string =
    await idOSConsumer.getSharedCredentialContentDecrypted(credentialId);

  const data = JSON.parse(credentialContents);

  // Verify the credential
  const verificationResult = await idOSConsumer.verifyCredentials(data, [
    {
      issuer: SERVER_ENV.KRAKEN_ISSUER,
      publicKeyMultibase: SERVER_ENV.KRAKEN_PUBLIC_KEY_MULTIBASE,
    },
  ]);

  if (!verificationResult) {
    throw new Error("Invalid credential signature.");
  }

  return data;
}
