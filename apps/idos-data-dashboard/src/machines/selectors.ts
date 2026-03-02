import type { idOSClientLoggedIn } from "@idos-network/client";
import type { WalletType } from "@idos-network/kwil-infra/actions";
import type { SnapshotFrom } from "xstate";
import type { dashboardMachine } from "./dashboard.machine";

type DashboardSnapshot = SnapshotFrom<typeof dashboardMachine>;

export const selectIsLoading = (snapshot: DashboardSnapshot): boolean =>
  snapshot.matches("idle") ||
  snapshot.matches("reconnecting") ||
  snapshot.matches("initializingIdOS");

export const selectIsDisconnected = (snapshot: DashboardSnapshot): boolean =>
  snapshot.matches("disconnected") || snapshot.matches("connecting");

export const selectIsConnectingFaceSign = (snapshot: DashboardSnapshot): boolean =>
  snapshot.matches("connecting") && snapshot.context.walletType === "FaceSign";

export const selectIsCreatingFacesignProfile = (snapshot: DashboardSnapshot): boolean =>
  snapshot.matches("creatingFacesignProfile");

export const selectIsLoggedIn = (snapshot: DashboardSnapshot): boolean =>
  snapshot.matches("loggedIn");

export const selectHasAccount = (snapshot: DashboardSnapshot): boolean =>
  snapshot.matches("loggedIn") && snapshot.context.idOSClient?.state === "logged-in";

export const selectIsNoProfile = (snapshot: DashboardSnapshot): boolean =>
  snapshot.matches("noProfile");

export const selectIsError = (snapshot: DashboardSnapshot): boolean => snapshot.matches("error");

export const selectIsDisconnecting = (snapshot: DashboardSnapshot): boolean =>
  snapshot.matches("disconnecting");

export const selectWalletAddress = (snapshot: DashboardSnapshot): string | null =>
  snapshot.context.walletAddress;

export const selectWalletType = (snapshot: DashboardSnapshot): WalletType | null =>
  snapshot.context.walletType;

export const selectLoggedInClient = (snapshot: DashboardSnapshot): idOSClientLoggedIn | null => {
  const client = snapshot.context.idOSClient;
  if (client && client.state === "logged-in") {
    return client;
  }

  return null;
};

export const selectError = (snapshot: DashboardSnapshot): string | null => snapshot.context.error;

export const selectMachineState = (snapshot: DashboardSnapshot): string => snapshot.value as string;
