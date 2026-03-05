import { assign, fromPromise } from "xstate";
import type { Context, SharedTokenData } from "../types";

export interface TransakContext {
  transakTokenData: SharedTokenData | null;
  transakWidgetUrl: string | null;
}

export const emptyContext: TransakContext = {
  transakTokenData: null,
  transakWidgetUrl: null,
};

// Transak Flow
export const flow = {
  initial: "requestRelayAG",
  states: {
    requestRelayAG: {
      meta: {
        description: "Requesting access grant for idOS relay...",
      },
      invoke: {
        id: "requestRelayAG",
        src: "requestRelayAG",
        input: ({ context }: { context: Context }) => ({
          client: context.loggedInClient,
          credentialId: context.credentialId,
        }),
        onDone: {
          target: "createRelayShareToken",
          actions: ["setRelayAG"],
        },
        onError: {
          target: "error",
        },
      },
    },

    createRelayShareToken: {
      meta: {
        description: "Creating idOS relay share token...",
      },
      invoke: {
        id: "createRelayShareToken",
        src: "createRelayShareToken",
        input: ({ context }: { context: Context }) => ({
          dag: context.relayAG,
          provider: "transak",
        }),
        onDone: {
          target: "fetchWidgetUrl",
          actions: ["setTransakTokenData"],
        },
        onError: {
          target: "error",
        },
      },
    },

    fetchWidgetUrl: {
      meta: {
        description: "Fetching Transak widget URL...",
      },
      invoke: {
        id: "fetchTransakWidgetUrl",
        src: "fetchTransakWidgetUrl",
        input: ({ context }: { context: Context }) => ({
          walletAddress: context.walletAddress,
          transakTokenData: context.transakTokenData,
        }),
        onDone: {
          target: "transakWidgetUrlFetched",
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
    transakWidgetUrlFetched: {
      type: "final",
    },
  },
} as const;

// Transak actions
export const actions = {
  setTransakTokenData: assign({
    transakTokenData: ({ event }) => event.output,
  }),

  setTransakWidgetUrl: assign({
    transakWidgetUrl: ({ event }) => event.output?.widgetUrl ?? null,
  }),
};

// Transak actors
export const actors = {
  fetchTransakWidgetUrl: fromPromise(
    async ({
      input,
    }: {
      input: {
        walletAddress: Context["walletAddress"];
        transakTokenData: Context["transakTokenData"];
      };
    }) => {
      if (!input.walletAddress || !input.transakTokenData) {
        throw new Error("Missing required data for Transak widget URL");
      }

      const response = await fetch("/app/kyc/transak/widget-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: input.walletAddress,
          fiatAmount: "100",
          kycShareToken: input.transakTokenData.token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to create Transak widget URL");
      }

      return response.json();
    },
  ),
};
