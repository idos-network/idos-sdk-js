import type { SnapshotFrom } from "xstate";

import { assign, setup } from "xstate";

import {
  actions as journeysActions,
  actors as journeysActors,
  flow as journeysFlow,
} from "./flows/journeys";
import { actions as keysActions, actors as keysActors, flow as keysFlow } from "./flows/keys";
import { actors as sessionActors, flow as sessionFlow } from "./flows/session";
import {
  actions as termsAndConditionsActions,
  actors as termsAndConditionsActors,
  flow as termsAndConditionsFlow,
} from "./flows/termsAndConditions";
import { emptyContext, type Context } from "./types";

const STEP_TRANSITION_DELAY_MS = 500;

export const onboardingMachine = setup({
  types: {
    context: {} as Context,
  },
  guards: {
    hasError: ({ context }: { context: Context }) => context.errorMessage !== null,
    hasKeys: ({ context }: { context: Context }) => context.hasKeys,
    hasClientId: ({ context }: { context: Context }) => context.relayClientId !== null,
    hasAcceptedTermsAndConditions: ({ context }: { context: Context }) =>
      context.acceptedTermsAndConditions,
  },
  actions: {
    setIdOSClient: assign({
      idOSClient: ({ event }) => event.idOSClient,
    }),

    setErrorMessage: assign({
      errorMessage: ({ event }) => event.error?.message ?? null,
    }),

    storeSession: assign({
      userId: ({ event }) => event.output.userId,
      hasKeys: ({ event }) => event.output.hasKeys,
      acceptedTermsAndConditions: ({ event }) => event.output.acceptedTermsAndConditions,
      relayClientId: ({ event }) => event.output.relayClientId,
    }),

    ...keysActions,
    ...termsAndConditionsActions,
    ...journeysActions,
  },
  actors: {
    ...sessionActors,
    ...keysActors,
    ...termsAndConditionsActors,
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
      after: {
        [STEP_TRANSITION_DELAY_MS]: [
          {
            target: "error",
            guard: "hasError",
          },
          {
            target: "termsAndConditions",
          },
        ],
      },
    },

    // step 1
    termsAndConditions: termsAndConditionsFlow,
    termsAndConditionsDone: {
      after: {
        [STEP_TRANSITION_DELAY_MS]: [
          {
            target: "error",
            guard: "hasError",
          },
          {
            target: "keys",
          },
        ],
      },
    },

    // step 2
    keys: keysFlow,
    keysDone: {
      after: {
        [STEP_TRANSITION_DELAY_MS]: [
          {
            target: "error",
            guard: "hasError",
          },
          {
            target: "journeys",
          },
        ],
      },
    },

    // step 3
    journeys: journeysFlow,
    journeysDone: {
      after: {
        [STEP_TRANSITION_DELAY_MS]: [
          {
            target: "error",
            guard: "hasError",
          },
          {
            target: "done",
          },
        ],
      },
    },

    // step 4
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
  if (snapshot.matches("termsAndConditions") || snapshot.matches("termsAndConditionsDone")) {
    return 1;
  }

  if (snapshot.matches("keys") || snapshot.matches("keysDone")) {
    return 2;
  }

  if (snapshot.matches("journeys") || snapshot.matches("journeysDone")) {
    return 3;
  }

  if (snapshot.matches("done")) {
    return 4;
  }

  return 0;
};
