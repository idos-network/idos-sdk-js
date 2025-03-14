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

/**
 * Get the profile of the current user.
 */
export async function getUserProfile(kwilClient: KwilActionClient) {
  const [user] = await kwilClient.call<[idOSUser]>({
    name: "get_user",
  });
  return user;
}
