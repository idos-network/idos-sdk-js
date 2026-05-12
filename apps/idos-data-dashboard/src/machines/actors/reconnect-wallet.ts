import { reconnect } from "@wagmi/core";
import { fromPromise } from "xstate";

import { getEvmAccount, wagmiConfig } from "@/core/wagmi";
import { createFaceSignProvider } from "@/lib/facesign";

import type { ReconnectWalletInput, ReconnectWalletOutput } from "../dashboard.machine";

const EVM_RECONNECT_TIMEOUT_MS = 5000;

export async function ensureEvmConnected(): Promise<void> {
  if (getEvmAccount().isConnected) return;

  try {
    await reconnect(wagmiConfig);
    if (getEvmAccount().isConnected) return;
  } catch {}

  if (wagmiConfig.state.status === "connected") return;

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("EVM reconnection timed out"));
    }, EVM_RECONNECT_TIMEOUT_MS);

    const unsubscribe = wagmiConfig.subscribe(
      (state) => state.status,
      (status) => {
        if (status === "connected") {
          clearTimeout(timeout);
          unsubscribe();
          resolve();
        }
      },
    );

    if (wagmiConfig.state.status === "connected") {
      clearTimeout(timeout);
      unsubscribe();
      resolve();
    }
  });
}

export const reconnectWallet = fromPromise<ReconnectWalletOutput, ReconnectWalletInput>(
  async ({ input }) => {
    const { walletType } = input;

    switch (walletType) {
      case "EVM": {
        const account = getEvmAccount();
        if (!account.isConnected || !account.address) {
          throw new Error("EVM reconnection failed");
        }
        if (account.address.toLowerCase() !== input.walletAddress.toLowerCase()) {
          throw new Error(
            `EVM reconnection address mismatch: expected ${input.walletAddress}, got ${account.address}`,
          );
        }
        return { nearWallet: null };
      }

      case "NEAR": {
        const { connector } = await import("@/core/near");

        const wallet = await connector.getConnectedWallet();

        if (!wallet) {
          throw new Error("NEAR wallet session expired");
        }
        return { nearWallet: wallet };
      }

      case "Stellar":
      case "XRPL":
        return { nearWallet: null };

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
        return { nearWallet: null };
      }

      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  },
);
