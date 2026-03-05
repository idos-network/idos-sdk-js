import { fromPromise } from "xstate";
import { disconnectEvm } from "@/core/wagmi";
import { queryClient } from "@/query-client";
import type { DisconnectWalletInput } from "../dashboard.machine";

export const disconnectWallet = fromPromise<void, DisconnectWalletInput>(async ({ input }) => {
  const { walletType, nearSelector, idOSClient } = input;

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
      const { clearFaceSignProvider } = await import("@/core/signers");
      clearFaceSignProvider();
    }

    if (idOSClient && "logOut" in idOSClient && idOSClient.state === "logged-in") {
      await idOSClient.logOut();
    }
  } catch (error) {
    console.error(`Error during ${walletType} disconnect:`, error);
  }

  queryClient.clear();
});
