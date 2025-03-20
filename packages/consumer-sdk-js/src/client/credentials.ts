import {
  createCredentialCopy as _createCredentialCopy,
  getAllCredentials as _getAllCredentials,
  getCredentialById as _getCredentialById,
  buildInsertableIDOSCredential,
  hexEncodeSha256Hash,
  type idOSCredential,
  utf8Encode,
} from "@idos-network/core";
import invariant from "tiny-invariant";
import type { ConsumerConfig } from "./create-consumer-config";

/**
 * Get all idOSCredentials for the given consumer
 */
export async function getAllCredentials({ kwilClient }: ConsumerConfig) {
  return _getAllCredentials(kwilClient);
}

/**
 * Get an idOSCredential by its `id`
 */
export async function getCredentialById({ kwilClient }: ConsumerConfig, id: string) {
  return _getCredentialById(kwilClient, id);
}

/**
 * Get the SHA256 hash of the content of an idOSCredential
 */
interface GetCredentialContentSha256HashParams extends Pick<ConsumerConfig, "kwilClient"> {
  decryptCredentialContent: (credential: idOSCredential) => Promise<string>;
}
export async function getCredentialContentSha256Hash(
  { kwilClient, decryptCredentialContent }: GetCredentialContentSha256HashParams,
  id: string,
) {
  const credential = await _getCredentialById(kwilClient, id);

  invariant(credential, `"idOSCredential" with id ${id} not found`);
  const content = await decryptCredentialContent(credential);

  return hexEncodeSha256Hash(utf8Encode(content));
}

/**
 * Create a copy of an idOSCredential for the given consumer
 * This doesn't create an Access Grant and is used only for passporting flows
 */
export async function createCredentialCopy(
  { kwilClient }: Pick<ConsumerConfig, "kwilClient">,
  id: string,
  consumerRecipientEncryptionPublicKey: string,
  consumerInfo: {
    consumerAddress: string;
    lockedUntil: number;
    decryptCredentialContent?: (credential: idOSCredential) => Promise<string>;
    encryptCredentialContent?: (
      content: string,
      encryptorPublicKey: string,
    ) => Promise<{
      content: string;
      encryptorPublicKey: string;
    }>;
  },
) {
  const originalCredential = await _getCredentialById(kwilClient, id);
  invariant(originalCredential, `"idOSCredential" with id ${id} not found`);

  invariant(consumerInfo.decryptCredentialContent, "decryptCredentialContent is required");
  invariant(consumerInfo.encryptCredentialContent, "encryptCredentialContent is required");

  const decryptedContent = await consumerInfo.decryptCredentialContent(originalCredential);

  const { content, encryptorPublicKey } = await consumerInfo.encryptCredentialContent(
    decryptedContent,
    consumerRecipientEncryptionPublicKey,
  );

  const insertableCredential = await buildInsertableIDOSCredential(
    originalCredential.user_id,
    "",
    content,
    consumerRecipientEncryptionPublicKey,
    encryptorPublicKey,
    consumerInfo,
  );

  const copyId = crypto.randomUUID();

  await _createCredentialCopy(kwilClient, {
    original_credential_id: originalCredential.id,
    ...originalCredential,
    ...insertableCredential,
    id: copyId,
  });

  return { id: copyId };
}
