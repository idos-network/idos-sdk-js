import type { idOSCredential } from "@idos-network/credentials";
import type { KwilActionClient } from "../kwil-infra";
import type { idOSGrant } from "../types";

/**
 * Returns the shared idOS Credential for the given `dataId`.
 */
export async function getSharedCredential(
  kwilClient: KwilActionClient,
  id: string,
): Promise<idOSCredential | undefined> {
  const [credential] = await kwilClient.call<idOSCredential[]>({
    name: "get_credential_shared",
    inputs: { id },
  });

  return credential;
}

/**
 * Returns the owned idOS Credential for the given `id`.
 */
export async function getCredentialOwned(
  kwilClient: KwilActionClient,
  id: string,
): Promise<idOSCredential | undefined> {
  const [credential] = await kwilClient.call<idOSCredential[]>({
    name: "get_credential_owned",
    inputs: { id },
  });

  return credential;
}

/**
 * Returns the idOSCredential `id` which content hash matches the given `contentHash`.
 */
export async function getCredentialIdByContentHash(
  kwilClient: KwilActionClient,
  content_hash: string,
): Promise<string | null> {
  const response = await kwilClient.call<[{ id: string }]>({
    name: "get_sibling_credential_id",
    inputs: { content_hash },
  });

  return response[0]?.id ?? null;
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
): Promise<idOSGrant[]> {
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
): Promise<EditCredentialAsIssuerParams> {
  await kwilClient.execute({
    name: "edit_public_notes_as_issuer",
    description: "Edit a credential in your idOS profile",
    inputs: params,
  });

  return params;
}

/**
 * Returns a list of idOSCredentials that have been shared with the given `userId`.
 */
export async function getCredentialsSharedByUser(
  kwilClient: KwilActionClient,
  userId: string,
): Promise<idOSCredential[]> {
  return kwilClient.call<idOSCredential[]>({
    name: "get_credentials_shared_by_user",
    inputs: { user_id: userId, issuer_auth_public_key: null },
  });
}

/**
 * Returns all idOSCredentials
 */
export async function getAllCredentials(kwilClient: KwilActionClient): Promise<idOSCredential[]> {
  return kwilClient.call<idOSCredential[]>({
    name: "get_credentials",
    inputs: {},
  });
}

export interface CreateCredentialByDelegatedWriteGrantParams {
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
export async function createCredentialByDelegatedWriteGrant(
  kwilClient: KwilActionClient,
  params: CreateCredentialByDelegatedWriteGrantParams,
): Promise<CreateCredentialByDelegatedWriteGrantParams> {
  await kwilClient.execute({
    name: "create_credentials_by_dwg",
    description: "Create a new credential in your idOS profile",
    inputs: params,
  });

  return params;
}

/**
 * Removes an idOSCredential by the given `id`.
 */
export async function removeCredential(
  kwilClient: KwilActionClient,
  id: string,
): Promise<{ id: string }> {
  await kwilClient.execute({
    name: "remove_credential",
    description: "Remove a credential from your idOS profile",
    inputs: { id },
  });

  return { id };
}

/**
 * Returns an idOSCredential by the given `id`.
 */
export async function getCredentialById(
  kwilClient: KwilActionClient,
  id: string,
): Promise<idOSCredential | undefined> {
  const response = await kwilClient.call<idOSCredential[]>({
    name: "get_credential_owned",
    inputs: { id },
  });

  return response.find((r) => r.id === id);
}

export type ShareableCredential = {
  id: string;
  original_credential_id: string;
  public_notes: string;
  public_notes_signature: string;
  broader_signature: string;
  content: string;
  encryptor_public_key: string;
  issuer_auth_public_key: string;
  grantee_wallet_identifier: string;
  locked_until: number;
};
/**
 * Shares an idOSCredential to the given `userId`.
 */
export async function shareCredential(
  kwilClient: KwilActionClient,
  credential: ShareableCredential,
): Promise<ShareableCredential> {
  await kwilClient.execute({
    name: "share_credential",
    description: "Share a credential with another user on idOS",
    inputs: credential,
  });

  return credential;
}

export type CreateCredentialCopyParams = {
  id: string;
  original_credential_id: string;
  public_notes: string;
  public_notes_signature: string;
  broader_signature: string;
  content: string;
  encryptor_public_key: string;
  issuer_auth_public_key: string;
};

/**
 * Creates a new idOSCredential as a copy of the given `originalCredentialId` without creating an Access Grant
 * Used only for passporting flows
 */
export async function createCredentialCopy(
  kwilClient: KwilActionClient,
  params: CreateCredentialCopyParams,
): Promise<CreateCredentialCopyParams> {
  await kwilClient.execute({
    name: "create_credential_copy",
    description: "Share a credential with another user on idOS",
    inputs: params,
  });

  return params;
}
