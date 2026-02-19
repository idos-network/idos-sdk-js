import { reconnect } from "@wagmi/core";
import { fromPromise } from "xstate";
import { getEvmAccount, wagmiConfig } from "@/core/wagmi";
import type { ReconnectWalletInput } from "../dashboard.machine";

export const reconnectWallet = fromPromise<void, ReconnectWalletInput>(async ({ input }) => {
  const { walletType } = input;

  switch (walletType) {
    case "EVM": {
      const account = getEvmAccount();
      if (account.isConnected && account.address) {
        return;
      }

      await reconnect(wagmiConfig);
      const reconnectedAccount = getEvmAccount();
      if (!reconnectedAccount.isConnected || !reconnectedAccount.address) {
        throw new Error("EVM reconnection failed");
      }
      if (reconnectedAccount.address.toLowerCase() !== input.walletAddress.toLowerCase()) {
        throw new Error(
          `EVM reconnection address mismatch: expected ${input.walletAddress}, got ${reconnectedAccount.address}`,
        );
      }
      return;
    }

    case "NEAR": {
      const { initializeNearSelector } = await import("@/core/near");
      const selector = await initializeNearSelector();
      if (!selector.isSignedIn()) {
        throw new Error("NEAR wallet session expired");
      }
      return;
    }

    case "Stellar":
    case "XRPL":
      return;

    default:
      throw new Error(`Unsupported wallet type: ${walletType}`);
  }
});
