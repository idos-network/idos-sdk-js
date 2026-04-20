import { fromPromise } from "xstate";

export interface Context {}

export const emptyContext: Context = {};

export const flow = {
  initial: "checkJourneys",
  states: {
    checkJourneys: {
      always: [
        {
          target: "journeysGenerated",
          guard: "hasClientId",
        },
        {
          target: "generateJourneys",
        },
      ],
    },

    generateJourneys: {
      invoke: {
        id: "generateJourneys",
        src: "generateJourneys",
        onDone: {
          target: "generateJourneysDone",
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    generateJourneysDone: {
      invoke: {
        id: "fetchSession",
        src: "fetchSession",
        onDone: {
          target: "journeysGenerated",
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

    journeysGenerated: {
      type: "final" as const,
    },
  },
  onDone: [
    {
      target: "error",
      guard: "hasError",
    },
    {
      target: "journeysDone",
    },
  ],
} as const;

export const actions = {};

export const actors = {
  generateJourneys: fromPromise(async () => {
    const response = await fetch("/api/journeys", {
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
