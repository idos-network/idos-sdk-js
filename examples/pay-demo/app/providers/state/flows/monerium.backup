import { assign, fromPromise } from "xstate";
import type { Context } from "../types";

export interface MoneriumIban {
  profile: string;
  address: string;
  iban: string;
  bic: string;
  chain: string;
  state: string;
  emailNotifications: boolean;
}

export interface MoneriumContext {
  moneriumAuthUrl: string | null;
  moneriumCode: string | null;
  moneriumProfileStatus: string | null;
  moneriumProfileIbans: MoneriumIban[] | null;
}

export const emptyContext: MoneriumContext = {
  moneriumAuthUrl: null,
  moneriumCode: null,
  moneriumProfileStatus: null,
  moneriumProfileIbans: null,
};

// Monerium Flow
export const flow = {
  initial: "createMoneriumUser",
  states: {
    createMoneriumUser: {
      invoke: {
        id: "createMoneriumUser",
        src: "createMoneriumUser",
        input: ({ context }: { context: Context }) => context.sharedCredential,
        onDone: {
          target: "createMoneriumProfile",
        },
        onError: {
          target: "requestMoneriumAuth",
        },
      },
    },
    requestMoneriumAuth: {
      invoke: {
        id: "requestMoneriumAuth",
        src: "requestMoneriumAuth",
        input: ({ context }: { context: Context }) => context.sharedCredential,
        onDone: {
          target: "moneriumAuthUrlFetched",
          actions: ["setMoneriumAuthUrl"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    moneriumAuthUrlFetched: {
      on: {
        accessTokenFromCode: {
          target: "accessTokenFromCode",
          actions: ["setMoneriumCode"],
        },
      },
    },
    accessTokenFromCode: {
      invoke: {
        id: "moneriumAccessTokenFromCode",
        src: "moneriumAccessTokenFromCode",
        input: ({ context }: { context: Context }) => context.moneriumCode,
        onDone: {
          target: "createMoneriumProfile",
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    createMoneriumProfile: {
      invoke: {
        id: "createMoneriumProfile",
        src: "createMoneriumProfile",
        input: ({ context }: { context: Context }) => context.sharedCredential,
        onDone: {
          target: "fetchProfileStatus",
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    fetchProfileStatus: {
      invoke: {
        id: "fetchMoneriumProfileStatus",
        src: "fetchMoneriumProfileStatus",
        onDone: [
          {
            actions: ["setMoneriumProfileStatus", "setMoneriumProfileIbans"],
            target: "dataOrTokenFetched",
          },
        ],
        onError: [
          {
            target: "waitForApproval",
            actions: ["incrementFindCredentialAttempts"],
          },
        ],
      },
    },
    waitForApproval: {
      after: {
        2000: "fetchProfileStatus",
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

// Monerium actions
export const actions = {
  setMoneriumAuthUrl: assign({
    moneriumAuthUrl: ({ event }) => event.output,
  }),

  setMoneriumCode: assign({
    moneriumCode: ({ event }) => event.code,
  }),

  setMoneriumProfileStatus: assign({
    moneriumProfileStatus: ({ event }) => event.output.status,
  }),

  setMoneriumProfileIbans: assign({
    moneriumProfileIbans: ({ event }) => event.output.ibans,
  }),
};

// Monerium actors
export const actors = {
  createMoneriumUser: fromPromise(async ({ input }: { input: Context["sharedCredential"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    const moneriumUser = await fetch(`/app/kyc/monerium/user?credentialId=${input.id}`);

    if (moneriumUser.status !== 200) {
      throw new Error("User was not created, or already exists.");
    }

    return await moneriumUser.json().then((data) => data.url);
  }),

  requestMoneriumAuth: fromPromise(async ({ input }: { input: Context["sharedCredential"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    const moneriumAuth = await fetch(`/app/kyc/monerium/auth?credentialId=${input.id}`);

    if (moneriumAuth.status !== 200) {
      throw new Error("Monerium API is not available. Please try again later.");
    }

    return await moneriumAuth.json().then((data) => data.url);
  }),

  moneriumAccessTokenFromCode: fromPromise(
    async ({ input }: { input: Context["moneriumCode"] }) => {
      if (!input) {
        throw new Error("Monerium code not found");
      }

      const moneriumAuth = await fetch(`/app/kyc/monerium/code?code=${input}`);

      if (moneriumAuth.status !== 200) {
        throw new Error("Monerium API is not available. Please try again later.");
      }

      return true;
    },
  ),

  createMoneriumProfile: fromPromise(async ({ input }: { input: Context["sharedCredential"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    const moneriumProfile = await fetch(`/app/kyc/monerium/profile?credentialId=${input.id}`);

    if (moneriumProfile.status !== 200) {
      throw new Error("Monerium API is not available. Please try again later.");
    }

    return true;
  }),

  fetchMoneriumProfileStatus: fromPromise(async () => {
    const moneriumProfileStatus = await fetch("/app/kyc/monerium/status");

    if (moneriumProfileStatus.status !== 200) {
      throw new Error("Monerium API is not available. Please try again later.");
    }

    const data = await moneriumProfileStatus.json();

    if (data.state !== "approved") {
      throw new Error("KYC is not active, please try again later.");
    }

    return data;
  }),
};
