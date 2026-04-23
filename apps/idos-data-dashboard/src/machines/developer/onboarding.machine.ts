import type { SnapshotFrom } from "xstate";

import { assign, setup } from "xstate";

export interface OnboardingContext {
  userId: string | null;
}

export type OnboardingEvent =
  | {
      type: "INIT";
      userId: string | null;
    }
  | { type: "KEYS_GENERATED" }
  | { type: "JOURNEYS_CREATED" }
  | { type: "RESET" };

export const onboardingMachine = setup({
  types: {
    context: {} as OnboardingContext,
    events: {} as OnboardingEvent,
  },
  guards: {
    hasUserId: ({ event }) =>
      event.type === "INIT" && typeof event.userId === "string" && event.userId.length > 0,
    isSignedOut: ({ event }) => event.type === "INIT" && !event.userId,
  },
  actions: {
    resetContext: assign({
      userId: () => null,
    }),
    syncSession: assign({
      userId: ({ context, event }) => (event.type === "INIT" ? event.userId : context.userId),
    }),
  },
}).createMachine({
  id: "developerOnboarding",
  initial: "signIn",
  context: {
    userId: null,
  },
  states: {
    login,

    signIn: {
      invoke: {
        src: "signIn",
        input: ({ context }): SignInInput => {
          return {
            userId: context.userId,
          };
        },
      },
      on: {
        SESSION_UPDATED: [
          {
            target: "generateKeys",
            guard: "hasUserId",
            actions: "syncSession",
          },
          {
            actions: "syncSession",
          },
        ],
        RESET: {
          target: "checkingSession",
          actions: "resetContext",
        },
      },
    },

    generateKeys: {
      on: {
        SESSION_UPDATED: [
          {
            target: "signIn",
            guard: "isSignedOut",
            actions: "syncSession",
          },
          {
            actions: "syncSession",
          },
        ],
        KEYS_GENERATED: "createJourneys",
        RESET: {
          target: "checkingSession",
          actions: "resetContext",
        },
      },
    },

    createJourneys: {
      on: {
        SESSION_UPDATED: [
          {
            target: "signIn",
            guard: "isSignedOut",
            actions: "syncSession",
          },
          {
            actions: "syncSession",
          },
        ],
        JOURNEYS_CREATED: "done",
        RESET: {
          target: "checkingSession",
          actions: "resetContext",
        },
      },
    },

    done: {
      on: {
        ONBOARDING_STARTED: [
          {
            target: "signIn",
            guard: "isSignedOut",
            actions: "syncSession",
          },
          {
            actions: "syncSession",
          },
        ],
        RESET: {
          target: "checkingSession",
          actions: "resetContext",
        },
      },
    },
  },
});

type OnboardingSnapshot = SnapshotFrom<typeof onboardingMachine>;

export const selectActiveStep = (snapshot: OnboardingSnapshot): number => {
  if (snapshot.matches("checkingSession")) {
    return 0;
  }

  if (snapshot.matches("generateKeys")) {
    return 1;
  }

  if (snapshot.matches("createJourneys")) {
    return 2;
  }

  if (snapshot.matches("done")) {
    return 3;
  }

  return 0;
};
