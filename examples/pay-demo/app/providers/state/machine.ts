import { assign, setup } from "xstate";
import { actions } from "./actions";
import { actors } from "./actors";
import type { Context } from "./types";

/**
 * State machine for managing idOS authentication and credential flow
 * Handles:
 * - Wallet connection
 * - KYC process
 * - Credential management
 * - Access grant management
 */
export const machine = setup({
  types: {
    context: {} as Context,
  },
  actors,
  actions,
}).createMachine({
  id: "idos",
  initial: "notConfigured",
  context: {
    walletAddress: null,
    provider: null,
    kycUrl: null,
    krakenDAG: null,
    kycType: null,
    client: null,
    profile: null,
    loggedInClient: null,
    sharableToken: null,
    credential: null,
    sharedCredential: null,
    findCredentialAttempts: 0,
    data: null,
    noahUrl: null,
    hifiTosUrl: null,
    hifiTosId: null,
    hifiUrl: null,
    hifiKycStatus: null,
    getHifiKycStatusAttempts: 0,
    onRampAccount: null,
  },
  states: {
    notConfigured: {
      on: {
        configure: {
          actions: ["configure"],
          target: "createClient",
        },
      },
    },
    createClient: {
      invoke: {
        id: "createClient",
        src: "createClient",
        onDone: {
          target: "checkProfile",
          actions: ["setClient"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    checkProfile: {
      invoke: {
        id: "checkProfile",
        src: "checkProfile",
        input: ({ context }) => context.client,
        onDone: {
          target: "login",
          actions: assign({
            profile: true,
          }),
        },
        onError: {
          target: "chooseKYCType",
          actions: assign({
            profile: false,
          }),
        },
      },
    },
    chooseKYCType: {
      on: {
        startKYC: {
          target: "startKYC",
          actions: ["setKycType"],
        },
      },
    },
    startKYC: {
      invoke: {
        id: "startKYC",
        src: "startKYC",
        input: ({ context }) => context.kycType,
        onDone: {
          target: "waitForKYC",
          actions: "setKycUrl",
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    waitForKYC: {
      on: {
        kycCompleted: {
          target: "login",
          actions: "setKycUrl",
        },
      },
    },
    login: {
      invoke: {
        id: "loginClient",
        src: "loginClient",
        input: ({ context }) => context.client,
        onDone: {
          target: "findCredential",
          actions: ["setLoggedInClient"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    findCredential: {
      invoke: {
        id: "findCredential",
        src: "findCredential",
        input: ({ context }) => context.loggedInClient,
        onDone: [
          {
            actions: ["setCredential"],
            target: "requestAccessGrant",
          },
        ],
        onError: [
          {
            guard: ({ context }) => context.kycUrl !== null,
            target: "waitForCredential",
            actions: ["incrementFindCredentialAttempts"],
          },
          {
            guard: ({ context }) => context.kycUrl === null,
            target: "chooseKYCType",
          },
        ],
      },
    },
    waitForCredential: {
      after: {
        2000: "findCredential",
      },
      always: {
        guard: ({ context }) => context.findCredentialAttempts >= 40,
        target: "error",
        actions: ["setErrorMessage"],
      },
    },
    requestAccessGrant: {
      invoke: {
        id: "requestAccessGrant",
        src: "requestAccessGrant",
        input: ({ context }) => ({
          client: context.loggedInClient,
          credential: context.credential,
        }),
        onDone: {
          actions: ["setSharedCredential"],
          target: "accessGranted",
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    accessGranted: {
      on: {
        getSharableToken: {
          target: "createSharableToken",
        },
        fetchUserData: {
          target: "fetchUserData",
        },
        createNoahCustomer: {
          target: "createNoahCustomer",
        },
        startHifi: {
          target: "startHifi",
        },
      },
    },
    startHifi: {
      invoke: {
        id: "createHifiTocLink",
        src: "createHifiTocLink",
        onDone: {
          target: "hifiTosFetched",
          actions: ["setHifiTosUrl"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    hifiTosFetched: {
      on: {
        acceptHifiTos: {
          target: "verifyHifiTos",
          actions: ["setHifiTosId"],
        },
      },
    },
    verifyHifiTos: {
      invoke: {
        id: "verifyHifiTos",
        src: "verifyHifiTos",
        input: ({ context }) => ({
          hifiTosId: context.hifiTosId,
          sharedCredential: context.sharedCredential,
        }),
        onDone: {
          target: "getHifiKycStatus",
          actions: ["setHifiUrl"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    getHifiKycStatus: {
      invoke: {
        id: "getHifiKycStatus",
        src: "getHifiKycStatus",
        onDone: [
          {
            target: "createOnRampAccount",
          },
        ],
        onError: [
          {
            target: "waitForHifiKycStatus",
            actions: ["incrementGetHifiKycStatusAttempts"],
          },
        ],
      },
    },
    waitForHifiKycStatus: {
      after: {
        2000: "getHifiKycStatus",
      },
      always: {
        guard: ({ context }) => context.getHifiKycStatusAttempts >= 40,
        target: "error",
        actions: ["setErrorMessage"],
      },
    },
    createOnRampAccount: {
      invoke: {
        id: "createOnRampAccount",
        src: "createOnRampAccount",
        onDone: {
          target: "dataOrTokenFetched",
          actions: ["setOnRampAccount"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    createNoahCustomer: {
      invoke: {
        id: "createNoahCustomer",
        src: "createNoahCustomer",
        input: ({ context }) => context.sharedCredential,
        onDone: {
          target: "dataOrTokenFetched",
          actions: ["setNoahUrl"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    createSharableToken: {
      initial: "requestKrakenDAG",
      states: {
        requestKrakenDAG: {
          invoke: {
            id: "requestKrakenDAG",
            src: "requestKrakenDAG",
            input: ({ context }) => ({
              client: context.loggedInClient,
              credential: context.credential,
            }),
            onDone: {
              target: "createToken",
              actions: ["setKrakenDAG"],
            },
            onError: {
              target: "error",
            },
          },
        },
        createToken: {
          invoke: {
            id: "createSharableToken",
            src: "createSharableToken",
            input: ({ context }) => context.krakenDAG,
            onDone: {
              target: "dataOrTokenFetched",
              actions: ["setSharableToken"],
            },
            onError: {
              target: "error",
              actions: ["setErrorMessage"],
            },
          },
        },
        error: {
          type: "final",
        },
        dataOrTokenFetched: {
          type: "final",
        },
      },
      onDone: {
        target: "dataOrTokenFetched",
      },
    },
    fetchUserData: {
      invoke: {
        src: "createSharableToken",
        input: ({ context }) => context.sharedCredential,
        onDone: {
          target: "dataOrTokenFetched",
          actions: ["setUserData"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    dataOrTokenFetched: {
      on: {
        revokeAccessGrant: {
          target: "revokeAccessGrant",
        },
      },
    },
    revokeAccessGrant: {
      invoke: {
        id: "revokeAccessGrant",
        src: "revokeAccessGrant",
        input: ({ context }) => ({
          client: context.loggedInClient,
          sharedCredential: context.sharedCredential,
        }),
        onDone: {
          target: "notConfigured",
          actions: ["reset"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    done: {
      // todo
    },
    error: {
      type: "final",
    },
  },
  on: {
    RESET: {
      actions: ["reset"],
      target: ".notConfigured",
    },
  },
});
