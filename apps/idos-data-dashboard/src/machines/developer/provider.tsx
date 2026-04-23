import type { ReactNode } from "react";

import { createActorContext } from "@xstate/react";

import { onboardingMachine } from "./onboarding.machine";

export const MachineContext = createActorContext(onboardingMachine);

export function MachineProvider({ children }: { children: ReactNode }) {
  return <MachineContext.Provider>{children}</MachineContext.Provider>;
}

export const useSelector = MachineContext.useSelector;
export const useActorRef = MachineContext.useActorRef;

export { selectActiveStep } from "./onboarding.machine";
export type { OnboardingContext, OnboardingEvent } from "./onboarding.machine";
