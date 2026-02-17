import { assign, fromPromise } from "xstate";
import type { Context } from "../types";

export interface HifiContext {
  hifiTosUrl: string | null;
  hifiTosId: string | null;
  hifiUrl: string | null;
  // biome-ignore lint/suspicious/noExplicitAny: false positive
  hifiKycStatus: "ACTIVE" | any;
  getHifiKycStatusAttempts: number;
  // biome-ignore lint/suspicious/noExplicitAny: false positive
  onRampAccount: any | null;
}

export const emptyContext: HifiContext = {
  hifiTosUrl: null,
  hifiTosId: null,
  hifiUrl: null,
  hifiKycStatus: null,
  getHifiKycStatusAttempts: 0,
  onRampAccount: null,
};

// Hifi Flow
export const flow = {
  initial: "createMoneriumUser",
  states: {
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
        input: ({ context }: { context: Context }) => ({
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
  },
  onDone: {
    target: "dataOrTokenFetched",
  },
} as const;

// Hifi actions
export const actions = {
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
};

// Hifi actors
export const actors = {
  createHifiTocLink: fromPromise(async () => {
    const hifiTocLink = await fetch("/app/kyc/hifi/tos");

    if (hifiTocLink.status !== 200) {
      throw new Error("Hifi API is not available. Please try again later.");
    }

    const data = await hifiTocLink.json();

    return data.link;
  }),

  verifyHifiTos: fromPromise(
    async ({
      input,
    }: {
      input: { hifiTosId: Context["hifiTosId"]; sharedCredential: Context["sharedCredential"] };
    }) => {
      if (!input.hifiTosId || !input.sharedCredential) {
        throw new Error("Hifi TOS ID or Shared credentials not found");
      }

      const hifiUrl = await fetch(
        `/app/kyc/hifi/link?credentialId=${input.sharedCredential.id}&signedAgreementId=${input.hifiTosId}`,
      );

      if (hifiUrl.status !== 200) {
        const text = await hifiUrl.text();
        throw new Error(`Hifi API is not available. Please try again later. ${text}`);
      }

      const data = await hifiUrl.json();

      return data.url;
    },
  ),

  getHifiKycStatus: fromPromise(async () => {
    const hifiKycStatus = await fetch("/app/kyc/hifi/status");

    if (hifiKycStatus.status !== 200) {
      throw new Error("Hifi API is not available. Please try again later.");
    }

    const data = await hifiKycStatus.json();

    if (data.status !== "ACTIVE") {
      throw new Error("KYC is not active, please try again later.");
    }

    return data.status;
  }),

  createOnRampAccount: fromPromise(async () => {
    const onRampAccount = await fetch("/app/kyc/hifi/account");

    if (onRampAccount.status !== 200) {
      throw new Error("Hifi API is not available. Please try again later.");
    }

    return await onRampAccount.json();
  }),
};
