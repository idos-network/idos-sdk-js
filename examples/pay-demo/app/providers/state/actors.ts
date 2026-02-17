// Import actors from all flows
import { actors as idosActors } from "./flows/idos";
import { actors as credentialActors } from "./flows/credentials";
import { actors as kycActors } from "./flows/kyc";
import { actors as dueActors } from "./flows/due";
import { actors as transakActors } from "./flows/transack";
import { actors as hifiActors } from "./flows/hifi";
import { actors as moneriumActors } from "./flows/monerium";
import { actors as noahActors } from "./flows/noah";
import { fromPromise } from "xstate";
import type { Context } from "./types";
import { COMMON_ENV } from "../envFlags.common";

export const actors = {
  // Flow-specific actors
  ...idosActors,
  ...credentialActors,
  ...kycActors,
  ...dueActors,
  ...transakActors,
  ...hifiActors,
  ...moneriumActors,
  ...noahActors,


  // Generic actors
  fetchCurrentUser: fromPromise(async () => {
    const user = await fetch("/app/current");

    if (user.status !== 200) {
      throw new Error("User not found");
    }

    return await user.json();
  }),

  // share token actors
  requestRelayAG: fromPromise(
    async ({
      input,
    }: {
      input: { client: Context["loggedInClient"]; credentialId: Context["credentialId"] };
    }) => {
      if (!input.client) {
        throw new Error("Client not found");
      }

      if (!input.credentialId) {
        throw new Error("No credential found");
      }

      const krakenSharedCredential = await input.client.requestAccessGrant(input.credentialId, {
        consumerEncryptionPublicKey: COMMON_ENV.KRAKEN_ENCRYPTION_PUBLIC_KEY,
        consumerAuthPublicKey: COMMON_ENV.KRAKEN_PUBLIC_KEY,
      });

      return krakenSharedCredential;
    },
  ),
};
