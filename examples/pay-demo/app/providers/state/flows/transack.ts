import { assign, fromPromise } from "xstate";
import type { Context, SharedTokenData } from "../types";

export interface TransakContext {
  transakTokenData: SharedTokenData | null;
  transakWidgetUrl: string | null;
  checkCredentialStatusAttempts: number;
}

export const emptyContext: TransakContext = {
  transakTokenData: null,
  transakWidgetUrl: null,
  checkCredentialStatusAttempts: 0,
};

// Transak Flow
export const flow = {
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
    error: {
      type: "final" as const,
    },
  },
  onDone: {
    target: "dataOrTokenFetched",
  },
} as const;

// Transak actions
export const actions = {
  setTransakTokenData: assign({
    transakTokenData: ({ event }) => event.output,
  }),

  setTransakWidgetUrl: assign({
    transakWidgetUrl: ({ event }) => event.output,
  }),

  incrementCheckCredentialStatusAttempts: assign({
    checkCredentialStatusAttempts: ({ context }) => context.checkCredentialStatusAttempts + 1,
  }),
};

// Transak actors
export const actors = {
  checkCredentialStatus: fromPromise(async ({ input }: { input: Context["transakTokenData"] }) => {
    if (!input) {
      throw new Error("Transak token data not found");
    }

    const response = await fetch(`/app/kyc/credential-status?credentialId=${input.id}`);

    if (response.status !== 200) {
      throw new Error("Failed to check credential status.");
    }

    const data = await response.json();

    if (data.kycStatus?.toLowerCase() === "pending") {
      throw new Error("KYC status is still pending");
    }

    return data;
  }),

  fetchTransakWidgetUrl: fromPromise(
    async ({
      input,
    }: {
      input: {
        walletAddress: Context["walletAddress"];
        transakTokenData: Context["transakTokenData"];
        sharedCredential: Context["sharedCredential"];
      };
    }) => {
      if (!input.walletAddress || !input.transakTokenData || !input.sharedCredential) {
        throw new Error("Missing required data for Transak widget URL");
      }

      const response = await fetch("/app/kyc/widget-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: input.walletAddress,
          fiatAmount: "100",
          kycShareToken: input.transakTokenData.token,
          credentialId: input.sharedCredential.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to create Transak widget URL");
      }

      const data = await response.json();
      return data.widgetUrl;
    },
  ),
};
