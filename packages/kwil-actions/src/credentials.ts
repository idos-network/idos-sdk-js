import type { idOSCredential } from "@idos-network/idos-sdk-types";
import type { KwilActionClient } from "./create-kwil-client";

interface CreateCredentialParams {
  user_id: string;
  content: string;
  content_hash?: string;
  public_notes: string;
  public_notes_signature: string;
  broader_signature: string;
  issuer_auth_public_key: string;
  encryptor_public_key: string;
}

/**
 * Returns the shared idOS Cedential for the given `dataId`.
 */
export async function getSharedCredential(kwilClient: KwilActionClient, id: string) {
  return kwilClient.call<idOSCredential[]>({
    name: "get_credential_shared",
    inputs: { id },
  });
}

/**
 * Returns the idOSCredential `id` which content hash matches the given `contentHash`.
 */
export async function getCredentialIdByContentHash(
  kwilClient: KwilActionClient,
  content_hash: string,
) {
  return kwilClient.call<string>({
    name: "get_credential_id_by_content_hash",
    inputs: { content_hash },
  });
}

/**
 * Creates a new idOSCredential if the signer has write grant access
 */
export async function createCredentialByWriteGrant(
  kwilClient: KwilActionClient,
  params: CreateCredentialParams,
) {
  return kwilClient.execute({
    name: "create_credential_by_write_grant",
    inputs: params,
  });
}

/**
 * Creates a new idOSCredential if the signer is a permissioned issuer
 */
export async function createCredentialAsInserter(
  kwilClient: KwilActionClient,
  params: CreateCredentialParams,
) {
  return kwilClient.execute({
    name: "upsert_credential_as_inserter",
    inputs: params,
  });
}

interface ShareCredentialByWriteGrantParams extends CreateCredentialParams {
  grantee_wallet_identifier: string;
  locked_until: number;
  original_credential_id: string;
}

/**
 * Shares an idOSCredential by granting write access to the given `grantee_wallet_identifier`.
 */
export async function shareCredentialByWriteGrant(
  kwilClient: KwilActionClient,
  params: ShareCredentialByWriteGrantParams,
) {
  return kwilClient.execute({
    name: "share_credential_by_write_grant",
    inputs: params,
  });
}

interface EditCredentialAsIssuerParams {
  public_notes_id: string;
  public_notes: string;
}

/**
 * Edits the public notes of an idOSCredential if the signer is a permissioned issuer.
 * This is how a credential is edited (modified) by a permissioned issuer.
 */
export async function editCredentialAsIssuer(
  kwilClient: KwilActionClient,
  params: EditCredentialAsIssuerParams,
) {
  return kwilClient.execute({
    name: "edit_public_notes_as_issuer",
    inputs: params,
  });
}
