import type { idOSClientLoggedIn } from "@idos-network/client";
import { highestMatchingCredential, parseLevel } from "@idos-network/credentials/utils";
import { assign, fromPromise } from "xstate";
import { COMMON_ENV } from "~/providers/envFlags.common";
import type { Context } from "../types";

export interface CredentialContext {
  userId: string | null;
  loggedInClient: idOSClientLoggedIn | null;
  credentialId: string | null;
  findCredentialAttempts: number;
}

export const emptyContext: CredentialContext = {
  userId: null,
  loggedInClient: null,
  credentialId: null,
  findCredentialAttempts: 0,
};

// Credential Flow
export const flow = {
  initial: "login",
  states: {
    login: {
      description: "We have to log in to idOS first",
      invoke: {
        id: "loginClient",
        src: "loginClient",
        input: ({ context }: { context: Context }) => context.client,
        onDone: [
          {
            target: "storeUserId",
            actions: ["setLoggedInClient"],
            guard: ({ context }: { context: Context }) => !context.userId,
          },
          {
            target: "checkSharedCredentials",
            actions: ["setLoggedInClient"],
            guard: ({ context }: { context: Context }) => context.userId,
          },
        ],
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    storeUserId: {
      invoke: {
        id: "storeUserId",
        src: "storeUserId",
        input: ({ context }: { context: Context }) => context.loggedInClient,
        onDone: {
          target: "checkSharedCredentials",
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    checkSharedCredentials: {
      description: "Check if we already have a shared credential (as consumer)",
      invoke: {
        id: "checkSharedCredentials",
        src: "checkSharedCredentials",
        onDone: {
          // We are done here, we have a shared credential
          actions: ["setCurrentUser"],
          target: "credentialFound",
        },
        onError: {
          // We are expecting a failure here if we don't have a shared credential
          target: "findCredential",
        },
      },
    },

    findCredential: {
      description: "Find credential in user's profile and request access grant",
      invoke: {
        id: "findCredential",
        src: "findCredential",
        input: ({ context }: { context: Context }) => context.loggedInClient,
        onDone: {
          // If we are able to find a credential, we can get an access grant
          actions: ["setCredentialId"],
          target: "requestAccessGrant",
        },
        onError: [
          {
            // If we are not able to find a credential, we have to wait for the credential to be created
            // but only if we are after KYC flow!
            guard: ({ context }: { context: Context }) => context.kycUrl !== null,
            target: "waitForCredential",
            actions: ["incrementFindCredentialAttempts"],
          },
          {
            guard: ({ context }: { context: Context }) => context.kycUrl === null,
            target: "error",
            actions: ["setErrorMessage"],
          },
        ],
      },
    },

    waitForCredential: {
      after: {
        // In case of proper setup of idOS relay app, we should have a shared credential ready by now
        // in other cases we have to check in users space if credentials are available
        2000: "checkSharedCredentials",
      },
      always: {
        guard: ({ context }: { context: Context }) => context.findCredentialAttempts >= 40,
        target: "error",
        actions: ["setErrorMessage"],
      },
    },

    requestAccessGrant: {
      invoke: {
        id: "requestAccessGrant",
        src: "requestAccessGrant",
        input: ({ context }: { context: Context }) => ({
          client: context.loggedInClient,
          credentialId: context.credentialId,
        }),
        onDone: {
          // Consumer should be able to read this credential now
          target: "checkSharedCredentials",
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
    credentialFound: {
      type: "final" as const,
    },
  },
  onDone: {
    target: "credentialFlowDone",
  },
} as const;

// Credential actions
export const actions = {
  setLoggedInClient: assign({
    loggedInClient: ({ event }) => event.output,
  }),

  setCredentialId: assign({
    credentialId: ({ event }) => event.output,
  }),

  incrementFindCredentialAttempts: assign({
    findCredentialAttempts: ({ context }) => context.findCredentialAttempts + 1,
  }),
};

// Credential actors
export const actors = {
  loginClient: fromPromise(async ({ input }: { input: Context["client"] }) => {
    if (!input) {
      throw new Error("Client not found");
    }

    return await input.logIn();
  }),

  checkSharedCredentials: fromPromise(async () => {
    const sharedCredentials = await fetch("/app/credential/shared");

    if (sharedCredentials.status !== 200) {
      throw new Error("Shared credentials not found");
    }

    return await sharedCredentials.json();
  }),

  storeUserId: fromPromise(async ({ input }: { input: Context["loggedInClient"] }) => {
    if (!input) {
      throw new Error("Client not found");
    }

    const response = await fetch("/app/current", {
      method: "POST",
      body: JSON.stringify({
        userId: input.user.id,
      }),
    });

    if (response.status !== 200) {
      throw new Error("Failed to store user ID");
    }

    return await response.json();
  }),

  findCredential: fromPromise(async ({ input }: { input: Context["loggedInClient"] }) => {
    if (!input) {
      throw new Error("Client not found");
    }

    const { base: level, addons } = parseLevel(COMMON_ENV.KRAKEN_LEVEL);

    const credentials = await input.filterCredentials({
      acceptedIssuers: [
        {
          // Kraken
          authPublicKey: COMMON_ENV.KRAKEN_PUBLIC_KEY,
        },
      ],
      credentialLevelOrHigherFilter: {
        userLevel: level,
        requiredAddons: addons,
      },
    });

    const credential = highestMatchingCredential(credentials, level, {
      addons,
    });

    if (!credential) {
      throw new Error("No credential found, start the KYC process");
    }

    return credential?.id;
  }),

  requestAccessGrant: fromPromise(
    async ({
      input,
    }: {
      input: { client: Context["loggedInClient"]; credential: Context["credential"] };
    }) => {
      if (!input.client) {
        throw new Error("Client not found");
      }

      if (!input.credential) {
        throw new Error("No credential found");
      }

      const id = input.credential.id;

      const sharedCredential = await input.client.requestAccessGrant(id, {
        consumerEncryptionPublicKey: COMMON_ENV.IDOS_ENCRYPTION_PUBLIC_KEY,
        consumerAuthPublicKey: COMMON_ENV.IDOS_PUBLIC_KEY,
      });

      return sharedCredential;
    },
  ),

  revokeAccessGrant: fromPromise(
    async ({
      input,
    }: {
      input: { client: Context["loggedInClient"]; sharedCredential: Context["sharedCredential"] };
    }) => {
      if (!input.client || !input.sharedCredential) {
        throw new Error("Client or access grant not found");
      }

      const accessGrants = await input.client.getAccessGrantsOwned();
      const accessGrant = accessGrants.find((ag) => ag.data_id === input.sharedCredential?.id);

      if (!accessGrant) {
        throw new Error("Access grant not found");
      }

      await input.client.revokeAccessGrant(accessGrant.id);

      return true;
    },
  ),
};
