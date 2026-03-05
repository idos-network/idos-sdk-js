import {
  type Credential,
  idOSConsumer as idOSConsumerClass,
  type idOSCredential,
} from "@idos-network/consumer";
import { highestMatchingCredential, parseLevel } from "@idos-network/credentials/utils";
import nacl from "tweetnacl";
import { COMMON_ENV } from "./envFlags.common";
import { SERVER_ENV } from "./envFlags.server";

export async function initIdOSConsumer() {
  return await idOSConsumerClass.init({
    nodeUrl: COMMON_ENV.IDOS_NODE_URL,
    consumerSigner: nacl.sign.keyPair.fromSecretKey(
      Buffer.from(SERVER_ENV.IDOS_CONSUMER_SIGNER, "base64"),
    ),
    recipientEncryptionPrivateKey: SERVER_ENV.IDOS_RECIPIENT_ENC_PRIVATE_KEY,
  });
}

export async function getCredentialShared(credentialId: string, inserterId?: string) {
  const idOSConsumer = await initIdOSConsumer();

  const grants = await idOSConsumer.getAccessGrantsForCredential(credentialId);

  if (!grants || grants.length === 0) {
    throw new Error("Grant not found.");
  }

  const grant = grants.find((g) => g.inserter_id === inserterId);

  if (inserterId && !grant) {
    throw new Error(`Inserter with id ${inserterId} was not found in grants.`);
  }

  // Get data
  const credentialContents: string =
    await idOSConsumer.getCredentialSharedContentDecrypted(credentialId);

  const data = JSON.parse(credentialContents) as Credential;

  const issuer = {
    issuer: SERVER_ENV.KRAKEN_ISSUER,
    publicKeyMultibase: SERVER_ENV.KRAKEN_PUBLIC_KEY_MULTIBASE,
  };

  // Verify the credential
  const [verificationResult, error] = await idOSConsumer.verifyCredential(data, [issuer]);

  if (!verificationResult) {
    throw new Error(`Invalid credential signature. ${JSON.stringify(error.get(issuer))}`);
  }

  return data;
}

export async function getUsableCredentialByUser(
  userId: string,
): Promise<Omit<idOSCredential, "content"> | undefined> {
  const idOSConsumer = await initIdOSConsumer();

  const credentials = await idOSConsumer.getCredentialsSharedByUser(userId);

  const { base, addons } = parseLevel(COMMON_ENV.KRAKEN_LEVEL.replace("+idos", ""));

  const credential = highestMatchingCredential(credentials, base, {
    addons,
  });

  return credential;
}
