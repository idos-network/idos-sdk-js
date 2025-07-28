import type { EncryptionPasswordStore } from "@idos-network/utils/enclave";
import type { KwilActionClient } from "../kwil-infra";
import type { idOSUser } from "../types";

/**
 * Checks if the user has a profile in the idOS associated with its wallet address.
 */
export async function hasProfile(kwilClient: KwilActionClient, address: string): Promise<boolean> {
  const [{ has_profile }] = await kwilClient.call<[{ has_profile: boolean }]>(
    {
      name: "has_profile",
      inputs: {
        address,
      },
    },
    undefined, // Don't use the signer to avoid causing an unnecessary signature.
  );

  return has_profile;
}

export interface CreateUserReqParams {
  id: string;
  recipient_encryption_public_key: string;
  encryption_password_store: EncryptionPasswordStore;
}
/**
 * Creates a user profile in the idOS.
 */
export async function createUser(
  kwilClient: KwilActionClient,
  params: CreateUserReqParams,
): Promise<CreateUserReqParams> {
  await kwilClient.execute({
    name: "add_user_as_inserter",
    description: "Create a user profile in idOS",
    inputs: params,
  });

  return params;
}

/**
 * Get the profile of the current user.
 */
export async function getUserProfile(kwilClient: KwilActionClient): Promise<idOSUser> {
  const [user] = await kwilClient.call<[idOSUser]>({
    name: "get_user",
    inputs: {},
  });

  return user;
}
