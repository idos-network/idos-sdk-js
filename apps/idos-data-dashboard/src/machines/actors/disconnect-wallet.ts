import { fromPromise } from "xstate";

import { disconnectEvm } from "@/core/wagmi";
import { queryClient } from "@/query-client";

import type { DisconnectInput } from "../dashboard/machine";

export const disconnect = fromPromise<void, DisconnectInput>(async ({ input }) => {
  const { walletType, nearSelector, idOSClient } = input;

  // Session deletion must not skip the enclave reset below.
  let sessionError: unknown;
  try {
    const response = await fetch("/api/session", {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to delete session (${response.status})`);
    }
  } catch (error) {
    console.error("Error during session delete:", error);
    sessionError = error;
  }

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
  } catch (error) {
    if (error instanceof Error && error.message === "Failed to clear FaceSign keys") {
      throw error;
    }
    console.error(`Error during ${walletType} disconnect:`, error);
  }

  try {
    if (idOSClient && "logOut" in idOSClient && idOSClient.state === "logged-in") {
      await idOSClient.logOut();
    }
  } finally {
    queryClient.clear();
  }

  if (sessionError) {
    throw sessionError;
  }
});
