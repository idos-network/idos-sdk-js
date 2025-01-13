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
  return kwilClient.call<idOSGrant[]>({
    name: "get_access_grants_granted",
    inputs: { page, size },
  });
}
