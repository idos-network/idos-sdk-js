import type { idOSClientWithUserSigner } from "@idos-network/client";

import { assign, fromPromise } from "xstate";

export interface Context {
  userId: string | null;
  relayClientId: string | null;
  hasKeys: boolean;
}

export const emptyContext: Context = {
  userId: null,
  relayClientId: null,
  hasKeys: false,
};

// Credential Flow
export const flow = {
  initial: "session",
  states: {
    session: {
      invoke: {
        id: "fetchSession",
        src: "fetchSession",
        onDone: [
          {
            target: "sessionDone",
            actions: ["storeSession"],
          },
        ],
        onError: {
          target: "login",
        },
      },
    },

    login: {
      invoke: {
        id: "login",
        src: "login",
        // @ts-expect-error - TODO: Fix this
        input: ({ context }: { context: Context }) => context.idOSClient,
        onDone: {
          target: "session",
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
    sessionDone: {
      type: "final" as const,
    },
  },
  onDone: {
    target: "sessionDone",
  },
} as const;

export const actions = {
  storeSession: assign({
    userId: ({ event }) => event.output.userId,
    hasKeys: ({ event }) => event.output.hasKeys,
    relayClientId: ({ event }) => event.output.relayClientId,
  }),
};

export const actors = {
  fetchSession: fromPromise(async () => {
    const response = await fetch("/api/session");

    if (!response.ok) {
      throw new Error("Unauthorized");
    }

    return response.json();
  }),

  login: fromPromise(async ({ input }: { input: idOSClientWithUserSigner }) => {
    const response = await fetch("/api/login").then((res) => res.json());

    // Send the proof message to signer
    const signature = await input.signer?.signMessage?.(response.proofMessage);

    const loginResponse = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        signature: signature,
        // @ts-expect-error - TODO: Fix this
        recipientEncryptionPublicKey: input.user.recipient_encryption_public_key,
        // @ts-expect-error - TODO: Fix this
        encryptionPasswordStore: input.user.encryption_password_store,
        walletAddress: input.walletIdentifier,
        walletPublicKey: input.walletPublicKey ?? "",
        walletType: input.walletType,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error("Failed to login");
    }

    return true;
  }),
};
