import { createActorContext } from "@xstate/react";
import { machine } from "./machine";
import { quoteMachine } from "./quote.machine";

export const MachineContext = createActorContext(machine);
export const QuoteMachineContext = createActorContext(quoteMachine);

export function MachineProvider({ children }: { children: React.ReactNode }) {
  return <MachineContext.Provider>{children}</MachineContext.Provider>;
}

export function QuoteMachineProvider({ children }: { children: React.ReactNode }) {
  return <QuoteMachineContext.Provider>{children}</QuoteMachineContext.Provider>;
}

export * from "./machine";
export * from "./types";
