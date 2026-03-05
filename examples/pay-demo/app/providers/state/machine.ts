import { setup } from "xstate";
import { actions } from "./actions";
import { actors } from "./actors";
import { flow as credentialFlow } from "./flows/credentials";
import { flow as dueFlow } from "./flows/due";
import { flow as idOSFlow } from "./flows/idos";
import { flow as kycFlow } from "./flows/kyc";
import { flow as transakFlow } from "./flows/transak";
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
      meta: {
        description: "Syncing user data...",
      },
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
    idOSFlow,
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
      meta: {
        description: "Processing provider configurations...",
      },
      invoke: {
        // Update context from current user data
        id: "fetchCurrentUser",
        src: "fetchCurrentUser",
        onDone: [
          {
            target: "transakFlow",
            actions: ["setCurrentUser"],
            guard: "isTransak",
          },
          /*{
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
    transakFlow,
    // noahFlow,
    // moneriumFlow,
    // hifiFlow,

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
