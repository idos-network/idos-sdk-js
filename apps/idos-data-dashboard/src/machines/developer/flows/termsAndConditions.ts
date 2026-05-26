import { fromPromise } from "xstate";

export const flow = {
  initial: "checkTermsAndConditions",
  states: {
    checkTermsAndConditions: {
      always: [
        {
          target: "termsAndConditionsAccepted",
          guard: "hasAcceptedTermsAndConditions",
        },
        {
          target: "showTermsAndConditions",
        },
      ],
    },

    showTermsAndConditions: {
      on: {
        acceptTermsAndConditions: {
          target: "acceptTermsAndConditions",
        },
      },
    },

    acceptTermsAndConditions: {
      invoke: {
        id: "acceptTermsAndConditions",
        src: "acceptTermsAndConditions",
        onDone: {
          target: "refreshSession",
        },
        onError: {
          target: "error",
          actions: ["setErrorMessage"],
        },
      },
    },

    refreshSession: {
      invoke: {
        id: "fetchSession",
        src: "fetchSession",
        onDone: {
          target: "termsAndConditionsAccepted",
          actions: ["storeSession"],
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
    termsAndConditionsAccepted: {
      type: "final" as const,
    },
  },
  onDone: {
    target: "termsAndConditionsDone",
  },
} as const;

export const actions = {};

export const actors = {
  acceptTermsAndConditions: fromPromise(async () => {
    const response = await fetch("/api/developer-tc", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to accept Terms & Conditions");
    }

    return response.json();
  }),
};
