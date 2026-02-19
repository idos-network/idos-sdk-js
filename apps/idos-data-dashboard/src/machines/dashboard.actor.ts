import { createActor } from "xstate";
import { connectWallet } from "./actors/connect-wallet";
import { disconnectWallet } from "./actors/disconnect-wallet";
import { initializeIdOS } from "./actors/idOS-initialise";
import { reconnectWallet } from "./actors/reconnect-wallet";
import { dashboardMachine } from "./dashboard.machine";

export const dashboardActor = createActor(
  dashboardMachine.provide({
    actors: {
      connectWallet,
      initializeIdOS,
      disconnectWallet,
      reconnectWallet,
    },
  }),
);

dashboardActor.start();
