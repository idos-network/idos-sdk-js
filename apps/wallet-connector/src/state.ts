import { create } from "zustand";

type ConnectedWallet = "evm" | "near" | "stellar" | "xrpl" | null;
type AccountId = string | null;

type Store = {
  connectedWallet: ConnectedWallet;
  accountId: AccountId;
  setWallet: (wallet: ConnectedWallet) => void;
  setAccountId: (accountId: AccountId) => void;
};

export const useStore = create<Store>()((set) => ({
  connectedWallet: null,
  accountId: null,
  setWallet: (connectedWallet) => set({ connectedWallet }),
  setAccountId: (accountId) => set({ accountId }),
}));
