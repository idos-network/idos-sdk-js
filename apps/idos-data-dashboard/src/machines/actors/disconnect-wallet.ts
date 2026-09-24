import { fromPromise } from "xstate";

import { disconnectEvm } from "@/core/wagmi";
import { queryClient } from "@/query-client";

import type { DisconnectInput } from "../dashboard/machine";

export const disconnect = fromPromise<void, DisconnectInput>(async ({ input }) => {
  const { walletType, nearSelector, idOSClient } = input;

  // Clear the session (we are fine to ignore errors in here)
  await fetch("/api/session", {
    method: "DELETE",
  });

  try {
    if (walletType === "Stellar") {
      const { default: stellarKit } = await import("@/core/stellar-kit");
      await stellarKit.disconnect();
    }

    if (walletType === "NEAR" && nearSelector?.isSignedIn()) {
      const wallet = await nearSelector.wallet();
      await wallet.signOut();
    }

    if (walletType === "EVM") {
      await disconnectEvm();
    }

    if (walletType === "FaceSign") {
      try {
        const { clearFaceSignProvider } = await import("@/core/signers");
        await clearFaceSignProvider();
      } catch (error) {
        console.error("Error during FaceSign reset:", error);
        throw new Error("Failed to clear FaceSign keys", { cause: error });
      }
    }

    if (idOSClient && "logOut" in idOSClient && idOSClient.state === "logged-in") {
      await idOSClient.logOut();
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Failed to clear FaceSign keys") {
      throw error;
    }
    console.error(`Error during ${walletType} disconnect:`, error);
  }

  queryClient.clear();
});
