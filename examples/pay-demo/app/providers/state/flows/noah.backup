import { assign, fromPromise } from "xstate";
import type { Context } from "../types";

export interface NoahContext {
  noahUrl: string | null;
}

export const emptyContext: NoahContext = {
  noahUrl: null,
};

// Noah Flow
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
          target: "createCustomer",
          actions: ["setKrakenDAG"],
        },
        onError: {
          target: "error",
        },
      },
    },
    createCustomer: {
      invoke: {
        id: "createNoahCustomer",
        src: "createNoahCustomer",
        input: ({ context }: { context: Context }) => ({
          krakenDAG: context.krakenDAG,
          sharedCredential: context.sharedCredential,
        }),
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
    error: {
      type: "final" as const,
    },
    dataOrTokenFetched: {
      type: "final" as const,
    },
  },
  onDone: {
    target: "dataOrTokenFetched",
  },
} as const;

// Noah actions
export const actions = {
  setNoahUrl: assign({
    noahUrl: ({ event }) => event.output,
  }),
};

// Noah actors
export const actors = {
  createNoahCustomer: fromPromise(
    async ({
      input,
    }: {
      input: {
        sharedCredential: Context["sharedCredential"];
        krakenDAG: Context["krakenDAG"];
      };
    }) => {
      if (!input?.sharedCredential || !input?.krakenDAG) {
        throw new Error("Credential not found");
      }

      const customer = await fetch(
        `/app/kyc/noah/link?credentialId=${input.sharedCredential.id}&krakenDAG=${input.krakenDAG.id}`,
      );

      if (customer.status !== 200) {
        const text = await customer.text();
        throw new Error(`Noah API is not available. Please try again later. (Reason: ${text})`);
      }

      const data = await customer.json();

      return data.url;
    },
  ),
};
