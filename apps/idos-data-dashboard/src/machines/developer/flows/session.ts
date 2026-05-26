import type { idOSClientLoggedIn } from "@idos-network/client";

import { fromPromise } from "xstate";

export interface Context {
  userId: string | null;
  relayClientId: string | null;
  hasKeys: boolean;
  acceptedTermsAndConditions: boolean;
}

export const emptyContext: Context = {
  userId: null,
  relayClientId: null,
  hasKeys: false,
  acceptedTermsAndConditions: false,
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

export const actors = {
  fetchSession: fromPromise(async () => {
    const response = await fetch("/api/session");

    if (!response.ok) {
      throw new Error("Unauthorized");
    }

    return response.json();
  }),

  login: fromPromise(async ({ input }: { input: idOSClientLoggedIn }) => {
    const challengeResponse = await fetch("/api/login");
    if (!challengeResponse.ok) {
      throw new Error("Failed to fetch login challenge");
    }

    const challenge = await challengeResponse.json();

    // Send the proof message to signer
    const signature = await input.signer?.signMessage?.(challenge.proofMessage);
    if (!signature) {
      throw new Error("Failed to sign message");
    }

    const loginResponse = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        signature: signature,
        recipientEncryptionPublicKey: input.user.recipient_encryption_public_key,
        encryptionPasswordStore: input.user.encryption_password_store,
        walletAddress: input.walletIdentifier,
        walletPublicKey: input.walletPublicKey ?? "",
        walletType: input.walletType,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!loginResponse.ok) {
      throw new Error("Failed to login");
    }

    return true;
  }),
};
