// Import actors from all flows

import { fromPromise } from "xstate";
import { COMMON_ENV } from "../envFlags.common";
import { actors as credentialActors } from "./flows/credentials";
import { actors as dueActors } from "./flows/due";
import { actors as hifiActors } from "./flows/hifi";
import { actors as idosActors } from "./flows/idos";
import { actors as kycActors } from "./flows/kyc";
import { actors as moneriumActors } from "./flows/monerium";
import { actors as noahActors } from "./flows/noah";
import { actors as transakActors } from "./flows/transack";
import type { Context } from "./types";

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
      console.log("input", input);
      if (!input.client) {
        throw new Error("Client not found");
      }

      if (!input.credentialId) {
        throw new Error("No credential found");
      }

      return input.client.requestAccessGrant(input.credentialId, {
        consumerEncryptionPublicKey: COMMON_ENV.KRAKEN_ENCRYPTION_PUBLIC_KEY,
        consumerAuthPublicKey: COMMON_ENV.KRAKEN_PUBLIC_KEY,
      });
    },
  ),
};
