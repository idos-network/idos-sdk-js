import { fromPromise } from "xstate";

export interface Context {}

export const emptyContext: Context = {};

export const flow = {
  initial: "checkKeys",
  states: {
    checkKeys: {
      always: [
        {
          target: "keysGenerated",
          guard: "hasKeys",
        },
        {
          target: "generateKeys",
        },
      ],
    },

    generateKeys: {
      invoke: {
        id: "generateKeys",
        src: "generateKeys",
        onDone: {
          target: "generateKeysDone",
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    generateKeysDone: {
      invoke: {
        id: "fetchSession",
        src: "fetchSession",
        onDone: {
          target: "keysGenerated",
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

    keysGenerated: {
      type: "final" as const,
    },
  },
  onDone: [
    {
      target: "error",
      guard: "hasError",
    },
    {
      target: "keysDone",
    },
  ],
} as const;

export const actions = {};

export const actors = {
  generateKeys: fromPromise(async () => {
    const response = await fetch("/api/keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Unauthorized");
    }

    return true;
  }),
};
