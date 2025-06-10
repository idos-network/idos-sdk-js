import { assign } from "xstate";

export const actions = {
  configure: assign({
    walletAddress: ({ event }) => event.address,
    provider: ({ event }) => event.provider,
  }),

  reset: assign({
    walletAddress: null,
    provider: null,
    kycUrl: null,
    client: null,
    profile: null,
    loggedInClient: null,
    sharableToken: null,
    credential: null,
    sharedCredential: null,
    findCredentialAttempts: 0,
    data: null,
    errorMessage: null,
  }),

  setClient: assign({
    client: ({ event }) => event.output,
  }),

  setKycUrl: assign({
    kycUrl: ({ event }) => event.output,
  }),

  setLoggedInClient: assign({
    loggedInClient: ({ event }) => event.output,
  }),

  setCredential: assign({
    credential: ({ event }) => event.output,
  }),

  incrementFindCredentialAttempts: assign({
    findCredentialAttempts: ({ context }) => context.findCredentialAttempts + 1,
  }),

  setSharedCredential: assign({
    sharedCredential: ({ event }) => event.output ?? null,
  }),

  setSharableToken: assign({
    sharableToken: ({ event }) => event.output,
  }),

  setUserData: assign({
    data: ({ event }) => event.output,
  }),

  setErrorMessage: assign({
    errorMessage: ({ event }) => event.error?.message,
  }),
};
