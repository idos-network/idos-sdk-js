import type { idOSGrant } from "@idos-network/idos-sdk-types";
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
interface CreateAccessGrantByDAGParams {
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
): Promise<{ data: { tx_hash: string } }> {
  return kwilClient.execute({
    name: "create_ag_by_dag_for_copy",
    inputs: params,
  });
}
