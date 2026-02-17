import { assign } from "xstate";
import type { UserItem } from "./../store.server";
import { actions as credentialActions } from "./flows/credentials";
import { actions as dueActions } from "./flows/due";
import { actions as hifiActions } from "./flows/hifi";
// Import actions from all flows
import { actions as idosActions } from "./flows/idos";
import { actions as kycActions } from "./flows/kyc";
import { actions as moneriumActions } from "./flows/monerium";
import { actions as noahActions } from "./flows/noah";
import { actions as transakActions } from "./flows/transack";
import { type Context, emptyContext } from "./types";

export const actions = {
  // Core actions
  configure: assign({
    walletAddress: ({ event }) => event.address,
    provider: ({ event }) => event.provider,
  }),

  reset: assign({ ...emptyContext }),

  setCurrentUser: assign(({ event }: { event: { output: UserItem } }) => {
    return {
      // Generic stuff
      walletAddress: event.output.address,
      userId: event.output.idOSUserId ?? null,

      // Shared credential stuff
      credentialId: event.output.sharedKyc?.originalId ?? null,
      sharedCredentialId: event.output.sharedKyc?.sharedId ?? null,

      // Due stuff
      dueTosAccepted: event.output.due?.tosAccepted,
      dueKycStatus: event.output.due?.kycStatus,
      dueKycLink: event.output.due?.kycLink ?? null,
      dueAccountId: event.output.due?.accountId ?? null,
    } satisfies Partial<Context>;
  }),

  setErrorMessage: assign({
    errorMessage: ({ event }) => {
      console.log("setErrorMessage");
      console.log("event", event);
      return event.error?.message ?? null;
    },
  }),

  setSharableToken: assign({
    sharableToken: ({ event }) => event.output,
  }),

  // Generic actions
  setRelayAG: assign({
    relayAG: ({ event }) => event.output ?? null,
  }),

  // Flow-specific actions
  ...idosActions,
  ...credentialActions,
  ...kycActions,
  ...dueActions,
  ...transakActions,
  ...hifiActions,
  ...moneriumActions,
  ...noahActions,
};
