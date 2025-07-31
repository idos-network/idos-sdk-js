import { z } from "zod";
import type { KwilActionClient } from "../kwil-infra";
import type { DelegatedWriteGrant, idOSGrant } from "../types";

/**
 * Returns the amount of Access Grants that have been granted for the given `signer`.
 */
export async function getGrantsCount(
  kwilClient: KwilActionClient,
  params: { user_id: string | null } = { user_id: null },
): Promise<number> {
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

export const GET_GRANTS_DEFAULT_RECORDS_PER_PAGE = 10;

export async function getGrants(
  kwilClient: KwilActionClient,
  params: GetGrantsParams = { page: 1, size: GET_GRANTS_DEFAULT_RECORDS_PER_PAGE, user_id: null },
): Promise<idOSGrant[]> {
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

const CreateAccessGrantByDAGParamsSchema = z.object({
  dag_data_id: z.string(),
  dag_owner_wallet_identifier: z.string(),
  dag_grantee_wallet_identifier: z.string(),
  dag_signature: z.string(),
  dag_locked_until: z.number(),
  dag_content_hash: z.string(),
});

export type CreateAccessGrantByDAGParams = z.infer<typeof CreateAccessGrantByDAGParamsSchema>;

/**
 * Creates a new Access Grant from the given Delegated Access Grant payload.
 */
export async function createAccessGrantByDag(
  kwilClient: KwilActionClient,
  params: CreateAccessGrantByDAGParams,
): Promise<CreateAccessGrantByDAGParams> {
  const input = CreateAccessGrantByDAGParamsSchema.parse(params);
  await kwilClient.execute({
    name: "create_ag_by_dag_for_copy",
    description: "Create an Access Grant in idOS",
    inputs: input,
  });

  return params;
}

/**
 * Revokes an Access Grant for the given `id`.
 */
export async function revokeAccessGrant(
  kwilClient: KwilActionClient,
  id: string,
): Promise<{ id: string }> {
  await kwilClient.execute({
    name: "revoke_access_grant",
    description: "Revoke an Access Grant from idOS",
    inputs: { id },
  });

  return { id };
}

/**
 * Returns all the Access Grants that have been granted by the given `signer`.
 */
export async function getAccessGrantsOwned(kwilClient: KwilActionClient): Promise<idOSGrant[]> {
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
): Promise<string> {
  const [{ message }] = await kwilClient.call<[{ message: string }]>({
    name: "dag_message",
    inputs: params,
  });

  return message;
}

/**
 * Request a signature for a delegated write grant.
 */
export async function requestDWGMessage(
  kwilClient: KwilActionClient,
  params: DelegatedWriteGrant,
): Promise<string> {
  const [{ message }] = await kwilClient.call<[{ message: string }]>({
    name: "dwg_message",
    inputs: params,
  });

  return message;
}
