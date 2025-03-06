import type { idOSUser } from "../types";
import type { KwilActionClient } from "./create-kwil-client";

/**
 * Checks if the user has a profile in the idOS associated with its wallet address.
 */
export async function hasProfile(kwilClient: KwilActionClient, address: string) {
  const [{ has_profile }] = await kwilClient.call<[{ has_profile: boolean }]>({
    name: "has_profile",
    inputs: {
      address,
    },
  });

  return has_profile;
}

export async function getUserProfile(kwilClient: KwilActionClient) {
  const [user] = await kwilClient.call<[idOSUser]>({
    name: "get_user",
    inputs: {},
  });
  return user;
}

export interface CreateUserReqParams {
  id: string;
  recipient_encryption_public_key: string;
}
/**
 * Creates a user profile in the idOS.
 */
export async function createUser(kwilClient: KwilActionClient, params: CreateUserReqParams) {
  return kwilClient.execute({
    name: "add_user_as_inserter",
    inputs: params,
  });
}

export interface DelegatedWriteGrantSignatureRequest {
  owner_wallet_identifier: string;
  grantee_wallet_identifier: string;
  issuer_public_key: string;
  id: string;
  access_grant_timelock: string;
  not_usable_before: string;
  not_usable_after: string;
}
/**
 * Request a signature for a delegated write grant.
 */
export async function requestDWGSignature(
  kwilClient: KwilActionClient,
  params: DelegatedWriteGrantSignatureRequest,
) {
  const result = await kwilClient.call<[{ message: string }]>({
    name: "dwg_message",
    inputs: params,
  });

  return result[0].message ?? "";
}
