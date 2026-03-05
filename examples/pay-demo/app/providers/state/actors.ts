// Import actors from all flows

import { fromPromise } from "xstate";
import { COMMON_ENV } from "../envFlags.common";
import { actors as credentialActors } from "./flows/credentials";
import { actors as dueActors } from "./flows/due";
import { actors as idosActors } from "./flows/idos";
import { actors as kycActors } from "./flows/kyc";
import { actors as transakActors } from "./flows/transak";
import type { Context } from "./types";

export const actors = {
  // Flow-specific actors
  ...idosActors,
  ...credentialActors,
  ...kycActors,
  ...dueActors,
  ...transakActors,

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

      return input.client.requestAccessGrant(input.credentialId, {
        consumerEncryptionPublicKey: COMMON_ENV.KRAKEN_ENCRYPTION_PUBLIC_KEY,
        consumerAuthPublicKey: COMMON_ENV.KRAKEN_PUBLIC_KEY,
      });
    },
  ),

  createRelayShareToken: fromPromise(
    async ({ input }: { input: { dag: Context["relayAG"]; provider: string } }) => {
      if (!input) {
        throw new Error("Credential not found");
      }

      const response = await fetch(
        `/app/kyc/token?credentialId=${input.dag?.id}&provider=${input.provider}`,
      );

      if (response.status !== 200) {
        throw new Error("KYC API is not available. Please try again later.");
      }

      return response.json();
    },
  ),
};
