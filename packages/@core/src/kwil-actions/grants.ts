import type { KwilActionClient } from "../kwil-infra";
import type { DelegatedWriteGrant, idOSGrant } from "../types";

/**
 * Returns the amount of Access Grants that have been granted for the given `signer`.
 */
export async function getGrantsCount(
  kwilClient: KwilActionClient,
  params: { user_id: string | null } = { user_id: null },
) {
  const [{ count }] = await kwilClient.call<[{ count: number }]>({
    name: "get_access_grants_granted_count",
    inputs: params,
  });
  return count;
}

/**
 * Returns the Access Grants for the given `signer` in a paginated manner.
 */

export interface GetGrantsParams {
  page?: number;
  size?: number;
  user_id?: string | null;
}
export async function getGrants(kwilClient: KwilActionClient, params: GetGrantsParams) {
  //@todo: add pagination values to the response
  return kwilClient.call<idOSGrant[]>({
    name: "get_access_grants_granted",
    inputs: {
      page: params.page ?? 1,
      size: params.size ?? 10,
      user_id: params.user_id ?? null,
    },
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
    inputs: {},
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
export async function requestDAGMessage(
  kwilClient: KwilActionClient,
  params: idOSDAGSignatureParams,
) {
  const [{ message }] = await kwilClient.call<[{ message: string }]>({
    name: "dag_message",
    inputs: params,
  });

  return message;
}

/**
 * Request a signature for a delegated write grant.
 */
export async function requestDWGMessage(kwilClient: KwilActionClient, params: DelegatedWriteGrant) {
  const [{ message }] = await kwilClient.call<[{ message: string }]>({
    name: "dwg_message",
    inputs: params,
  });

  return message;
}
