import { createActorContext } from "@xstate/react";
import { machine } from "./machine";

export const MachineContext = createActorContext(machine);

export function MachineProvider({ children }: { children: React.ReactNode }) {
  return <MachineContext.Provider>{children}</MachineContext.Provider>;
}

export * from "./machine";
export * from "./types";
