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
    client: null,
    profile: null,
    loggedInClient: null,
    sharableToken: null,
    credentials: [],
    accessGrant: null,
    findCredentialsAttempts: 0,
    data: null,
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
          target: "startKYC",
          actions: assign({
            profile: false,
          }),
        },
      },
    },
    startKYC: {
      invoke: {
        id: "startKYC",
        src: "startKYC",
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
          target: "findCredentials",
          actions: ["setLoggedInClient"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    findCredentials: {
      invoke: {
        id: "findCredentials",
        src: "findCredentials",
        input: ({ context }) => context.loggedInClient,
        onDone: [
          {
            actions: ["setCredentials"],
            target: "requestAccessGrant",
          },
        ],
        onError: [
          {
            guard: ({ context }) => context.kycUrl !== null,
            target: "waitForCredentials",
            actions: ["incrementFindCredentialsAttempts"],
          },
          {
            guard: ({ context }) => context.kycUrl === null,
            target: "startKYC",
          },
        ],
      },
    },
    waitForCredentials: {
      after: {
        2000: "findCredentials",
      },
      always: {
        guard: ({ context }) => context.findCredentialsAttempts >= 20,
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
          credentials: context.credentials,
        }),
        onDone: {
          actions: ["setAccessGrant"],
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
      },
    },
    createSharableToken: {
      invoke: {
        id: "createSharableToken",
        src: "createSharableToken",
        input: ({ context }) => context.accessGrant,
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
    fetchUserData: {
      invoke: {
        src: "createSharableToken",
        input: ({ context }) => context.accessGrant,
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
          accessGrant: context.accessGrant,
        }),
      },
      onDone: {
        target: "notConfigured",
        actions: ["reset"],
      },
      onError: {
        target: "error",
        actions: ["setErrorMessage"],
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
