import type { idOSCredential, idOSGrant } from "../types";
import type { KwilActionClient } from "./create-kwil-client";

export interface CreateCredentialParams {
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
 * Returns the shared idOS Credential for the given `dataId`.
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

export interface GetAccessGrantByCredentialIdParams {
  credential_id: string;
}

/**
 * Returns a list of matching idOSGrants that associated with the given `credentialId`.
 */
export async function getAccessGrantsForCredential(
  kwilClient: KwilActionClient,
  params: GetAccessGrantByCredentialIdParams,
) {
  return kwilClient.call<idOSGrant[]>({
    name: "get_access_grants_for_credential",
    inputs: params,
  });
}

export interface EditCredentialAsIssuerParams {
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

/**
 * Returns a list of idOSCredentials that have been shared with the given `userId`.
 */
export async function getCredentialsSharedByUser(kwilClient: KwilActionClient, userId: string) {
  return kwilClient.call<idOSCredential[]>({
    name: "get_credentials_shared_by_user",
    inputs: { user_id: userId },
  });
}

export async function getAllCredentials(kwilClient: KwilActionClient) {
  return kwilClient.call<idOSCredential[]>({
    name: "get_credentials",
  });
}

export interface CreateCredentialsByDelegatedWriteGrantParams {
  issuer_auth_public_key: string;
  original_encryptor_public_key: string;
  original_credential_id: string;
  original_content: string;
  original_public_notes: string;
  original_public_notes_signature: string;
  original_broader_signature: string;
  copy_encryptor_public_key: string;
  copy_credential_id: string;
  copy_content: string;
  copy_public_notes_signature: string;
  copy_broader_signature: string;
  content_hash: string;
  dwg_owner: string;
  dwg_grantee: string;
  dwg_issuer_public_key: string;
  dwg_id: string;
  dwg_access_grant_timelock: string;
  dwg_not_before: string;
  dwg_not_after: string;
  dwg_signature: string;
}

/**
 * Creates a new credential from a delegated write grant.
 */
export async function createCredentialsByDelegatedWriteGrant(
  kwilClient: KwilActionClient,
  params: CreateCredentialsByDelegatedWriteGrantParams,
) {
  return kwilClient.execute({
    name: "create_credentials_by_dwg",
    inputs: params,
  });
}
