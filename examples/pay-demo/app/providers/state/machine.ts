import { setup } from "xstate";
import { actions } from "./actions";
import { actors } from "./actors";
import { flow as credentialFlow } from "./flows/credentials";
import { flow as dueFlow } from "./flows/due";
import { flow as idosFlow } from "./flows/idos";
import { flow as kycFlow } from "./flows/kyc";
import { type Context, emptyContext } from "./types";

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
  // @ts-expect-error some issue in xstate types
  actions,
  guards: {
    isTransak: ({ context }: { context: Context }) => context.provider === "transak",
    isMonerium: ({ context }: { context: Context }) => context.provider === "monerium",
    isNoah: ({ context }: { context: Context }) => context.provider === "noah",
    isHifi: ({ context }: { context: Context }) => context.provider === "hifi",
    isDue: ({ context }: { context: Context }) => context.provider === "due",
    hasError: ({ context }: { context: Context }) => context.errorMessage !== null,
  },
}).createMachine({
  id: "idos",
  initial: "notConfigured",
  context: emptyContext,
  states: {
    notConfigured: {
      on: {
        configure: {
          actions: ["configure"],
          target: "syncWithUserData",
        },
      },
    },

    // Sync with current user data
    syncWithUserData: {
      invoke: {
        id: "fetchCurrentUser",
        src: "fetchCurrentUser",
        onDone: {
          target: "idOSFlow",
          actions: ["setCurrentUser"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    // Check for profile
    idOSFlow: idosFlow,
    idOSDone: {
      always: [
        {
          guard: "hasError",
          target: "error",
        },
        {
          // we maybe have credentials, but we need to check them and do the login
          guard: ({ context }) => context.profile,
          target: "credentialFlow",
        },
        {
          // No profile no credentials
          guard: ({ context }) => !context.profile,
          target: "kycFlow",
        },
      ],
    },

    // After KYC is done check credentials flow
    // this is to ensure we have credentials ready
    credentialFlow,
    credentialFlowDone: {
      always: [
        {
          guard: "hasError",
          target: "error",
        },
        {
          // We have credentials, so we can move to provider flow
          guard: ({ context }) => context.credentialId !== null,
          target: "moveToProviderFlow",
        },
        {
          // We are missing credentials, so we need to create them
          guard: ({ context }) => context.credentialId === null,
          target: "kycFlow",
        },
      ],
    },

    // KYC
    kycFlow,

    // Decision flow what to do next (by provider)
    // Kyc (potentially credential sharing flow should ends up here)
    moveToProviderFlow: {
      invoke: {
        // Update context from current user data
        id: "fetchCurrentUser",
        src: "fetchCurrentUser",
        onDone: [
          /* {
            target: "transakFlow",
            actions: ["setCurrentUser"],
            guard: "isTransak",
          },
          {
            target: "moneriumFlow",
            actions: ["setCurrentUser"],
            guard: "isMonerium",
          },
          {
            target: "noahFlow",
            actions: ["setCurrentUser"],
            guard: "isNoah",
          },
          {
            target: "startHifi",
            actions: ["setCurrentUser"],
            guard: "isHifi",
          },*/
          {
            target: "dueFlow",
            actions: ["setCurrentUser"],
            guard: "isDue",
          },
        ],
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    // Provider flows
    dueFlow,
    // transakFlow: createTransakFlow(),
    // noahFlow: createNoahFlow(),
    //moneriumFlow: createMoneriumFlow(),
    // hifiFlow: createHifiFlow(),

    /*createSharableToken: {
      initial: "requestKrakenDAG",
      states: {
        requestKrakenDAG: {
          invoke: {
            id: "requestKrakenDAG",
            src: "requestKrakenDAG",
            input: ({ context }: { context: Context }) => ({
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
            input: ({ context }: { context: Context }) => ({
              dag: context.krakenDAG,
              provider: "transak",
            }),
            onDone: {
              target: "checkCredentialStatus",
              actions: ["setTransakTokenData"],
            },
            onError: {
              target: "error",
              actions: ["setErrorMessage"],
            },
          },
        },
        checkCredentialStatus: {
          invoke: {
            id: "checkCredentialStatus",
            src: "checkCredentialStatus",
            input: ({ context }: { context: Context }) => context.transakTokenData,
            onDone: {
              target: "fetchWidgetUrl",
              actions: ["setTransakTokenData"],
            },
            onError: [
              {
                guard: ({ context }: { context: Context }) =>
                  context.checkCredentialStatusAttempts >= 60,
                target: "error",
                actions: ["setErrorMessage"],
              },
              {
                target: "waitForCredentialStatus",
                actions: ["incrementCheckCredentialStatusAttempts"],
              },
            ],
          },
        },
        waitForCredentialStatus: {
          after: {
            5000: "checkCredentialStatus",
          },
        },
        fetchWidgetUrl: {
          invoke: {
            id: "fetchTransakWidgetUrl",
            src: "fetchTransakWidgetUrl",
            input: ({ context }: { context: Context }) => ({
              walletAddress: context.walletAddress,
              transakTokenData: context.transakTokenData,
              sharedCredential: context.sharedCredential,
            }),
            onDone: {
              target: "dataOrTokenFetched",
              actions: ["setTransakWidgetUrl"],
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
    },*/
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
        input: ({ context }: { context: Context }) => ({
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
