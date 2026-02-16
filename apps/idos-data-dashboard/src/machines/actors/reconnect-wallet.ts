import type { WalletSelector } from "@near-wallet-selector/core";
import { reconnect } from "@wagmi/core";
import { fromPromise } from "xstate";
import { initializeNearSelector } from "@/core/near";
import { getEvmAccount, wagmiConfig } from "@/core/wagmi";
import type { ReconnectWalletInput, ReconnectWalletOutput } from "../dashboard.machine";

export const reconnectWallet = fromPromise<ReconnectWalletOutput, ReconnectWalletInput>(
  async ({ input }) => {
    const { walletType } = input;
    let nearSelector: WalletSelector | null = null;

    switch (walletType) {
      case "EVM": {
        const account = getEvmAccount();
        if (account.isConnected && account.address) {
          return { nearSelector: null };
        }

        await reconnect(wagmiConfig);
        const reconnectedAccount = getEvmAccount();
        if (!reconnectedAccount.isConnected || !reconnectedAccount.address) {
          throw new Error("EVM reconnection failed");
        }
        return { nearSelector: null };
      }

      case "NEAR": {
        nearSelector = await initializeNearSelector();
        if (!nearSelector.isSignedIn()) {
          throw new Error("NEAR wallet session expired");
        }
        return { nearSelector };
      }

      case "Stellar":
      case "XRPL":
        return { nearSelector: null };

      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  },
);
