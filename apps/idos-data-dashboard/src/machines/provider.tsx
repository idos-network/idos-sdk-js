import { createActorContext } from "@xstate/react";
import { dashboardMachine } from "./dashboard.machine";

export const MachineContext = createActorContext(dashboardMachine);

export function MachineProvider({ children }: { children: React.ReactNode }) {
  return <MachineContext.Provider>{children}</MachineContext.Provider>;
}

export * from "./dashboard.machine";
