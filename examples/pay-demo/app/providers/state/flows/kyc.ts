import { assign, fromPromise } from "xstate";
import type { Context } from "../types";

export interface KycContext {
  kycType: "sumsub" | "persona" | null;
  kycUrl: string | null;
}

export const emptyContext: KycContext = {
  kycType: null,
  kycUrl: null,
};

// KYC Flow
export const flow = {
  initial: "chooseType",
  states: {
    chooseType: {
      on: {
        start: {
          target: "start",
          actions: ["setKycType"],
        },
      },
    },
    start: {
      meta: {
        description: "Creating an idOS relay link...",
      },
      invoke: {
        id: "getKycLink",
        src: "getKycLink",
        input: ({ context }: { context: Context }) => context.kycType,
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
          target: "kycDone",
        },
      },
    },
    kycDone: {
      type: "final" as const,
    },
    error: {
      type: "final" as const,
    },
  },
  onDone: {
    target: "credentialFlow",
  },
} as const;

// KYC actions
export const actions = {
  setKycType: assign({
    kycType: ({ event }) => event.kycType,
  }),

  setKycUrl: assign({
    kycUrl: ({ event }) => event.output,
  }),
};

// KYC actors
export const actors = {
  getKycLink: fromPromise(async ({ input }: { input: Context["kycType"] }) => {
    const kycUrl = await fetch(`/app/kyc/link?type=${input}`);
    const kycUrlData = await kycUrl.json();
    return kycUrlData.url;
  }),
};
