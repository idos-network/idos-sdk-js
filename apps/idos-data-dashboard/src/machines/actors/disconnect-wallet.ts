import { fromPromise } from "xstate";
import { disconnectEvm } from "@/core/wagmi";
import { queryClient } from "@/query-client";
import type { DisconnectWalletInput } from "../dashboard.machine";

export const disconnectWallet = fromPromise<void, DisconnectWalletInput>(async ({ input }) => {
  const { walletType, idOSClient } = input;

  try {
    if (walletType === "Stellar") {
      const { default: stellarKit } = await import("@/core/stellar-kit");
      await stellarKit.disconnect();
    }

    if (walletType === "NEAR") {
      const { getNearSelector } = await import("@/core/near");
      const nearSelector = getNearSelector();
      if (nearSelector?.isSignedIn()) {
        const wallet = await nearSelector.wallet();
        await wallet.signOut();
      }
    }

    if (walletType === "EVM") {
      await disconnectEvm();
    }

    if (idOSClient && "logOut" in idOSClient && idOSClient.state === "logged-in") {
      await idOSClient.logOut();
    }
  } catch (error) {
    console.error(`Error during ${walletType} disconnect:`, error);
  }

  queryClient.clear();
});
