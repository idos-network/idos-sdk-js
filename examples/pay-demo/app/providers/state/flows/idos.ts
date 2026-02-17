import type { idOSClientWithUserSigner } from "@idos-network/client";
import { createIDOSClient } from "@idos-network/client";
import { ethers } from "ethers";
import { assign, fromPromise } from "xstate";
import { COMMON_ENV } from "~/providers/envFlags.common";
import type { Context } from "../types";

export interface idOSContext {
  profile: boolean;
  walletAddress: string | null;
  client: idOSClientWithUserSigner | null;
}

export const emptyContext: idOSContext = {
  profile: false,
  walletAddress: null,
  client: null,
};

// idOS Flow
export const flow = {
  initial: "createClient",
  states: {
    createClient: {
      invoke: {
        id: "createClient",
        src: "createClient",
        onDone: {
          target: "checkProfile",
          actions: ["setClient"],
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },
    checkProfile: {
      invoke: {
        id: "checkProfile",
        src: "checkProfile",
        input: ({ context }: { context: Context }) => context.client,
        onDone: {
          target: "done",
          actions: ["setProfile"],
        },
        onError: {
          target: "done",
          actions: assign({
            profile: false,
          }),
        },
      },
    },
    done: {
      type: "final",
    },
    error: {
      type: "final",
    },
  },
  onDone: {
    target: "idOSDone",
  },
} as const;

// idOS actions
export const actions = {
  setProfile: assign({
    profile: ({ event }) => event.output,
  }),

  setClient: assign({
    client: ({ event }) => event.output,
  }),
};

// idOS actors
export const actors = {
  createClient: fromPromise(async () => {
    const config = createIDOSClient({
      enclaveOptions: {
        container: "#idOS-enclave",
        url: "https://enclave.playground.idos.network/",
      },
      nodeUrl: COMMON_ENV.IDOS_NODE_URL,
    });

    const idleClient = await config.createClient();

    // @ts-expect-error
    const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();

    return await idleClient.withUserSigner(signer);
  }),

  checkProfile: fromPromise(async ({ input }: { input: Context["client"] }) => {
    if (!input) {
      throw new Error("Client not found");
    }

    const hasProfile = await input.hasProfile();

    if (!hasProfile) {
      throw new Error("No profile found");
    }

    return hasProfile;
  }),
};
