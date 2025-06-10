import type { CustomSigner, WalletInfo } from "@idos-network/core";
import type { JsonRpcSigner } from "ethers";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Types for wallet connections
export type WalletType = WalletInfo["type"];

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletType: WalletType | null;
  walletAddress: string | null;
  walletPublicKey: string | null;
  walletError: string | null;
  signer?: JsonRpcSigner | CustomSigner | null;
}

export interface WalletActions {
  // Connection actions
  setWalletType: (wallet: WalletType | null) => void;
  setConnecting: (connecting: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setWalletPublicKey: (publicKey: string | null) => void;
  setWalletError: (error: string | null) => void;
  clearWalletError: () => void;
  setSigner: (signer: JsonRpcSigner | CustomSigner | null) => void;
  resetWallet: () => void;
}

export type WalletStore = WalletState & WalletActions;

// Initial state
const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  walletType: null,
  walletAddress: null,
  walletPublicKey: null,
  walletError: null,
};

export const useWalletStore = create<WalletStore>()(
  // @ts-ignore: @todo: check why it's complaining
  persist(
    (set) => ({
      ...initialState,
      setWalletType: (walletType) => set({ walletType }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setWalletAddress: (walletAddress) => set({ walletAddress, isConnected: !!walletAddress }),
      setWalletPublicKey: (walletPublicKey) => set({ walletPublicKey }),
      setWalletError: (walletError) => set({ walletError }),
      clearWalletError: () => set({ walletError: null }),
      resetWallet: () =>
        set({
          walletType: null,
          walletAddress: null,
          walletPublicKey: null,
          walletError: null,
          isConnected: false,
          isConnecting: false,
        }),
      setSigner: (signer) => set({ signer }),
    }),
    {
      name: "wallet-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        walletType: state.walletType,
        walletAddress: state.walletAddress,
        walletPublicKey: state.walletPublicKey,
        isConnected: state.isConnected,
      }),
    },
  ),
);
