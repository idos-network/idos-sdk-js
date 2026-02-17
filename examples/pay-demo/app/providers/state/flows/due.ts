import { assign, fromPromise } from "xstate";
import type { Context, SharedTokenData } from "../types";

export interface DueContext {
  dueKycStatus: "new" | "created" | "resubmission_required" | "pending" | "passed" | "failed";
  dueAccountId: string | null;
  dueTosAccepted: boolean;
  dueKycLink: string | null;
  dueTokenData: SharedTokenData | null;
  dueTosLinks: {
    tos: string;
    privacyPolicy: string;
  } | null;
  dueTosToken: string | null;
  dueKycAttempts: number;
}

export const emptyContext: DueContext = {
  dueKycStatus: "new",
  dueAccountId: null,
  
  dueTosAccepted: false,
  dueKycLink: null,
  dueTokenData: null,
  dueTosLinks: null,
  dueTosToken: null,
  dueKycAttempts: 0,
};

// Due Flow
export const flow = {
  initial: "start",
  states: {
    start: {
      always: [
        {
          description: "Due flow is done, we can move forward or wait for KYC to be done",
          target: "dueFlowDone",
          guard: ({ context }: { context: Context }) => ["pending", "failed", "passed"].includes(context.dueKycStatus),
        }, {
          description: "New due flow",
          target: "createDueAccount", 
          guard: ({ context }: { context: Context }) => context.dueAccountId === null,
        }, {
          description: "We have an account, but we are missing T&C",
          target: "showTos",
          guard: ({ context }: { context: Context }) => context.dueAccountId !== null && !context.dueTosAccepted,
        }, {
          description: "We have an account, but we need KYC",
          target: "requestRelayAG",
          guard: ({ context }: { context: Context }) => context.dueAccountId !== null && context.dueTosAccepted && context.dueKycStatus === "new",
        }
      ]
    },

    createDueAccount: {
      invoke: {
        id: "createDueAccount",
        src: "createDueAccount",
        onDone: {
          target: "showTos",
          actions: ["setDueAccount"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    requestRelayAG: {
      invoke: {
        id: "requestRelayAG",
        src: "requestRelayAG",
        input: ({ context }: { context: Context }) => ({
          client: context.loggedInClient,
          credential: context.credentialId,
        }),
        onDone: {
          target: "startKyc",
          actions: ["setRelayAG"],
        },
        onError: {
          target: "error",
        },
      },
    },

    startKyc: {
      invoke: {
        id: "startKyc",
        src: "startKyc",
        input: ({ context }: { context: Context }) => ({
          ag: context.relayAG,
        }),
        onDone: {
          target: "checkKycStatus",
          actions: ["setCurrentUser"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    showTos: {
      on: {
        acceptTos: [
          {
            target: "confirmTosAccepted",
          },
        ],
      },
    },

    confirmTosAccepted: {
      invoke: {
        id: "acceptDueTos",
        src: "acceptDueTos",
        onDone: [{
          target: "requestRelayAG",
          actions: ["setCurrentUser"],
          guard: ({ context }: { context: Context }) => context.dueKycStatus === "new",
        }, {
          target: "checkKycStatus",
          actions: ["setCurrentUser"],
          guard: ({ context }: { context: Context }) => context.dueKycStatus !== "new",
        }],
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    checkKycStatus: {
      invoke: {
        id: "fetchCurrentUser",
        src: "fetchCurrentUser",
        onDone: {
          actions: ["setCurrentUser"],
          target: "waitForKycToBeDone",
        },
      },
    },

    waitForKycToBeDone: {
      after: {
        5000: "checkKycStatus",
      },
      always: [
        {
          guard: ({ context }: { context: Context }) => context.dueKycAttempts >= 100,
          target: "error",
          actions: ["setErrorMessage"],
        },
        {
          target: "dueFlowDone",
          guard: ({ context }: { context: Context }) =>
            ["passed", "failed", "pending"].includes(context.dueKycStatus),
        },
      ],
    },

    error: {
      type: "final" as const,
    },

    dueFlowDone: {
      type: "final" as const,
    },
  },
} as const;

// Due actions
export const actions = {
  incrementDueKycAttempts: assign({
    dueKycAttempts: ({ context }) => context.dueKycAttempts + 1,
  }),
};

// Due actors
export const actors = {
  createSharableToken: fromPromise(
    async ({ input }: { input: { ag: Context["relayAG"] } }) => {
      if (!input.ag) {
        throw new Error("Credential not found");
      }

      const response = await fetch(
        `/app/kyc/due/kyc?agId=${input.ag?.id}`,
      );

      if (response.status !== 200) {
        throw new Error("KYC API is not available. Please try again later.");
      }

      return response.json();
    },
  ),

  createDueAccount: fromPromise(
    async () => {
      const dueAccount = await fetch( "/app/kyc/due/account", {
        method: "POST",
      });

      if (dueAccount.status !== 200) {
        throw new Error("Can't create due account, try again later.");
      }

      return await dueAccount.json();
    },
  ),

  acceptDueTos: fromPromise(
    async () => {
      const dueAccount = await fetch(
        "/app/kyc/due/tos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (dueAccount.status !== 200) {
        throw new Error("Due API is not available. Please try again later.");
      }

      return dueAccount.json();
    },
  ),


};
