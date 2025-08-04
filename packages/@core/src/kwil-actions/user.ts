import { EncryptionPasswordStoresEnum } from "@idos-network/utils/enclave";
import { z } from "zod";
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

const CreateUserReqParamsSchema: z.ZodObject<
  {
    id: z.ZodString;
    recipient_encryption_public_key: z.ZodString;
    encryption_password_store: typeof EncryptionPasswordStoresEnum;
  },
  "strip"
> = z.object({
  id: z.string(),
  recipient_encryption_public_key: z.string(),
  encryption_password_store: EncryptionPasswordStoresEnum,
});

export type CreateUserReqParams = z.infer<typeof CreateUserReqParamsSchema>;

/**
 * Creates a user profile in the idOS.
 */
export async function createUser(
  kwilClient: KwilActionClient,
  params: CreateUserReqParams,
): Promise<CreateUserReqParams> {
  const input = CreateUserReqParamsSchema.parse(params);
  await kwilClient.execute({
    name: "add_user_as_inserter",
    description: "Create a user profile in idOS",
    inputs: input,
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
