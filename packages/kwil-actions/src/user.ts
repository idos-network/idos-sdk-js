import type { KwilActionClient } from "./create-kwil-client";

export async function hasProfile(kwilClient: KwilActionClient, userAddress: string) {
  const [{ has_profile }] = await kwilClient.call<[{ has_profile: boolean }]>({
    name: "has_profile",
    inputs: {
      address: userAddress,
    },
  });

  return has_profile;
}
