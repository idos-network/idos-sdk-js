import { assign } from "xstate";

export const actions = {
  configure: assign({
    walletAddress: ({ event }) => event.address,
    provider: ({ event }) => event.provider,
  }),

  reset: assign({
    walletAddress: null,
    provider: null,
    kycType: null,
    kycUrl: null,
    client: null,
    profile: null,
    loggedInClient: null,
    sharableToken: null,
    credential: null,
    sharedCredential: null,
    krakenDAG: null,
    findCredentialAttempts: 0,
    errorMessage: null,
    noahUrl: null,
    hifiTosUrl: null,
    hifiTosId: null,
    hifiUrl: null,
    hifiKycStatus: null,
    getHifiKycStatusAttempts: 0,
    onRampAccount: null,
    moneriumCode: null,
    moneriumProfileStatus: null,
    moneriumProfileIbans: null,
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

  setErrorMessage: assign({
    errorMessage: ({ event }) => event.error?.message,
  }),

  setNoahUrl: assign({
    noahUrl: ({ event }) => event.output,
  }),

  setHifiTosUrl: assign({
    hifiTosUrl: ({ event }) => event.output,
  }),

  setHifiTosId: assign({
    hifiTosId: ({ event }) => event.signedAgreementId,
  }),

  setHifiUrl: assign({
    hifiUrl: ({ event }) => event.output,
  }),

  setHifiKycStatus: assign({
    hifiKycStatus: ({ event }) => event.output,
  }),

  incrementGetHifiKycStatusAttempts: assign({
    getHifiKycStatusAttempts: ({ context }) => context.getHifiKycStatusAttempts + 1,
  }),

  setOnRampAccount: assign({
    onRampAccount: ({ event }) => event.output,
  }),

  setKycType: assign({
    kycType: ({ event }) => event.kycType,
  }),

  setKrakenDAG: assign({
    krakenDAG: ({ event }) => event.output ?? null,
  }),

  setMoneriumAuthUrl: assign({
    moneriumAuthUrl: ({ event }) => event.output,
  }),

  setMoneriumCode: assign({
    moneriumCode: ({ event }) => event.code,
  }),

  setMoneriumProfileStatus: assign({
    moneriumProfileStatus: ({ event }) => event.output.status,
  }),

  setMoneriumProfileIbans: assign({
    moneriumProfileIbans: ({ event }) => event.output.ibans,
  }),
};
