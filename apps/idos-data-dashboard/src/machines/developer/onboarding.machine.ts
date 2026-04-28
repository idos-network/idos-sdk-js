import type { SnapshotFrom } from "xstate";

import { assign, setup } from "xstate";

import {
  actions as journeysActions,
  actors as journeysActors,
  flow as journeysFlow,
} from "./flows/journeys";
import { actions as keysActions, actors as keysActors, flow as keysFlow } from "./flows/keys";
import {
  actions as sessionActions,
  actors as sessionActors,
  flow as sessionFlow,
} from "./flows/session";
import { emptyContext, type Context } from "./types";

export const onboardingMachine = setup({
  types: {
    context: {} as Context,
  },
  guards: {
    hasError: ({ context }: { context: Context }) => context.errorMessage !== null,
    hasKeys: ({ context }: { context: Context }) => context.hasKeys,
    hasClientId: ({ context }: { context: Context }) => context.relayClientId !== null,
  },
  actions: {
    setIdOSClient: assign({
      idOSClient: ({ event }) => event.idOSClient,
    }),

    setErrorMessage: assign({
      errorMessage: ({ event }) => event.error?.message ?? null,
    }),

    ...sessionActions,
    ...keysActions,
    ...journeysActions,
  },
  actors: {
    ...sessionActors,
    ...keysActors,
    ...journeysActors,
  },
}).createMachine({
  id: "developerOnboarding",
  initial: "notConfigured",
  context: emptyContext,
  states: {
    notConfigured: {
      on: {
        init: {
          target: "session",
          actions: ["setIdOSClient"],
        },
      },
    },

    // step 0
    session: sessionFlow,
    sessionDone: {
      always: [
        {
          target: "error",
          guard: "hasError",
        },
        {
          target: "keys",
        },
      ],
    },

    // step 1
    keys: keysFlow,
    keysDone: {
      always: [
        {
          target: "error",
          guard: "hasError",
        },
        {
          target: "journeys",
        },
      ],
    },

    // step 2
    journeys: journeysFlow,
    journeysDone: {
      always: [
        {
          target: "error",
          guard: "hasError",
        },
        {
          target: "done",
        },
      ],
    },

    // step 3
    done: {
      type: "final" as const,
    },
    error: {
      type: "final" as const,
    },
  },
});

type OnboardingSnapshot = SnapshotFrom<typeof onboardingMachine>;

export const selectActiveStep = (snapshot: OnboardingSnapshot): number => {
  if (snapshot.matches("notConfigured") || snapshot.matches("session")) {
    return 0;
  }

  if (snapshot.matches("keys") || snapshot.matches("keysDone")) {
    return 1;
  }

  if (snapshot.matches("journeys") || snapshot.matches("journeysDone")) {
    return 2;
  }

  if (snapshot.matches("done")) {
    return 3;
  }

  return 0;
};
