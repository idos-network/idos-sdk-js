import type { WalletSelector } from "@near-wallet-selector/core";

import { reconnect } from "@wagmi/core";
import { fromPromise } from "xstate";

import { getEvmAccount, wagmiConfig } from "@/core/wagmi";
import { createFaceSignProvider } from "@/lib/facesign";

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
        if (reconnectedAccount.address.toLowerCase() !== input.walletAddress.toLowerCase()) {
          throw new Error(
            `EVM reconnection address mismatch: expected ${input.walletAddress}, got ${reconnectedAccount.address}`,
          );
        }
        return { nearSelector: null };
      }

      case "NEAR": {
        const { initializeNearSelector } = await import("@/core/near");
        nearSelector = await initializeNearSelector();
        if (!nearSelector.isSignedIn()) {
          throw new Error("NEAR wallet session expired");
        }
        return { nearSelector };
      }

      case "Stellar":
      case "XRPL":
        return { nearSelector: null };

      case "FaceSign": {
        const { setFaceSignProvider } = await import("@/core/signers");

        const provider = await createFaceSignProvider();

        // Try silent reconnect: ask the enclave for the stored key without showing UI
        const storedAddress = await provider.getAddress();
        if (storedAddress && storedAddress === input.walletAddress) {
          setFaceSignProvider(provider);
          return { nearSelector: null };
        }

        // Fall back to full session proposal (face scan)
        const address = await provider.init();
        if (address !== input.walletAddress) {
          provider.destroy();
          throw new Error("FaceSign address mismatch: the enclave returned a different key");
        }

        setFaceSignProvider(provider);
        return { nearSelector: null };
      }

      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  },
);
