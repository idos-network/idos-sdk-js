import { createActorContext } from "@xstate/react";
import { connectWallet } from "./actors/connect-wallet";
import { createFacesignProfile } from "./actors/create-profile";
import { disconnectWallet } from "./actors/disconnect-wallet";
import { initializeIdOS } from "./actors/initialize-idos";
import { reconnectWallet } from "./actors/reconnect-wallet";
import { dashboardMachine } from "./dashboard.machine";

export const MachineContext = createActorContext(
  dashboardMachine.provide({
    actors: {
      connectWallet,
      initializeIdOS,
      disconnectWallet,
      reconnectWallet,
      createFacesignProfile,
    },
  }),
);

export function MachineProvider({ children }: { children: React.ReactNode }) {
  return <MachineContext.Provider>{children}</MachineContext.Provider>;
}

export const useSelector = MachineContext.useSelector;
export const useActorRef = MachineContext.useActorRef;

export * from "./dashboard.machine";
