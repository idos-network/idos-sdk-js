import type { idOSGrant } from "../types";
import type { KwilActionClient } from "./create-kwil-client";

/**
 * Returns the amount of Access Grants that have been granted for the given `signer`.
 */
export async function getGrantsCount(kwilClient: KwilActionClient) {
  return kwilClient.call<number>({
    name: "get_access_grants_granted_count",
  });
}

/**
 * Returns the Access Grants for the given `signer` in a paginated manner.
 */
export async function getGrants(kwilClient: KwilActionClient, page = 1, size = 7) {
  //@todo: add pagination values to the response
  return kwilClient.call<idOSGrant[]>({
    name: "get_access_grants_granted",
    inputs: { page, size },
  });
}
export interface CreateAccessGrantByDAGParams {
  dag_data_id: string;
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_signature: string;
  dag_locked_until: number;
  dag_content_hash: string;
}

/**
 * Creates a new Access Grant from the given Delegated Access Grant payload.
 */
export async function createAccessGrantByDag(
  kwilClient: KwilActionClient,
  params: CreateAccessGrantByDAGParams,
) {
  return kwilClient.execute({
    name: "create_ag_by_dag_for_copy",
    description: "Create an Access Grant in idOS",
    inputs: params,
  });
}

/**
 * Revokes an Access Grant for the given `id`.
 */
export async function revokeAccessGrant(kwilClient: KwilActionClient, id: string) {
  return kwilClient.execute({
    name: "revoke_access_grant",
    description: "Revoke an Access Grant from idOS",
    inputs: { id },
  });
}

/**
 * Returns all the Access Grants that have been granted by the given `signer`.
 */
export async function getAccessGrantsOwned(kwilClient: KwilActionClient) {
  return kwilClient.call<idOSGrant[]>({
    name: "get_access_grants_owned",
  });
}

export interface idOSDAGSignatureParams {
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_data_id: string;
  dag_locked_until: number;
  dag_content_hash: string;
}

/**
 * Request a signature for a Delegated Access Grant
 */
export async function requestDAGSignature(
  kwilClient: KwilActionClient,
  params: idOSDAGSignatureParams,
) {
  return kwilClient.call<string>({
    name: "dag_message",
    inputs: params,
  });
}
