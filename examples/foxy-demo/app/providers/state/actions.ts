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
    credentials: [],
    accessGrant: false,
    findCredentialsAttempts: 0,
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

  setCredentials: assign({
    credentials: ({ event }) => event.output,
  }),

  incrementFindCredentialsAttempts: assign({
    findCredentialsAttempts: ({ context }) => context.findCredentialsAttempts + 1,
  }),

  setAccessGrant: assign({
    accessGrant: ({ event }) => event.output ?? false,
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
