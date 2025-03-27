import {
  base64Decode,
  base64Encode,
  buildInsertableIDOSCredential,
  hexEncodeSha256Hash,
  utf8Encode,
} from "@idos-network/core";
import {
  createCredentialCopy as _createCredentialCopy,
  getAllCredentials as _getAllCredentials,
  getCredentialById as _getCredentialById,
} from "@idos-network/core/kwil-actions";
import invariant from "tiny-invariant";
import type { ConsumerClientConfig } from "./create-consumer-client-config";

/**
 * Get all idOSCredentials for the given consumer
 */
export async function getAllCredentials({ kwilClient }: ConsumerClientConfig) {
  return _getAllCredentials(kwilClient);
}

/**
 * Get an idOSCredential by its `id`
 */
export async function getCredentialById({ kwilClient }: ConsumerClientConfig, id: string) {
  return _getCredentialById(kwilClient, id);
}

/**
 * Get the SHA256 hash of the content of an idOSCredential
 */
export async function getCredentialContentSha256Hash(
  { kwilClient, enclaveProvider }: ConsumerClientConfig,
  id: string,
) {
  const credential = await _getCredentialById(kwilClient, id);

  invariant(credential, `"idOSCredential" with id ${id} not found`);

  const plaintext = await enclaveProvider.decrypt(
    base64Decode(credential.content),
    base64Decode(credential.encryptor_public_key),
  );

  return hexEncodeSha256Hash(plaintext);
}

/**
 * Create a copy of an idOSCredential for the given consumer
 * This doesn't create an Access Grant and is used only for passporting flows
 */
export async function createCredentialCopy(
  { enclaveProvider, kwilClient }: ConsumerClientConfig,
  id: string,
  consumerRecipientEncryptionPublicKey: string,
  consumerInfo: {
    consumerAddress: string;
    lockedUntil: number;
  },
) {
  const originalCredential = await _getCredentialById(kwilClient, id);
  invariant(originalCredential, `"idOSCredential" with id ${id} not found`);

  const { content, encryptorPublicKey } = await enclaveProvider.encrypt(
    utf8Encode(originalCredential.content),
    base64Decode(consumerRecipientEncryptionPublicKey),
  );

  const insertableCredential = await buildInsertableIDOSCredential(
    originalCredential.user_id,
    "",
    base64Encode(content),
    consumerRecipientEncryptionPublicKey,
    base64Encode(encryptorPublicKey),
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
