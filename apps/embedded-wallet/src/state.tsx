import type { WalletType } from "@idos-network/core/kwil-actions";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

export type WalletPayload = {
  address: string;
  signature: string;
  public_key?: string[];
  message: string;
  disconnect: () => Promise<void>;
};

export const message = "Sign this message to prove you own this wallet";

type WalletContextValue = {
  walletPayload: WalletPayload | null;
  connectedWalletType: WalletType | null;

  setWalletPayload: (payload: WalletPayload | null) => void;
  setConnectedWalletType: (type: WalletType | null) => void;

  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletPayload, setWalletPayload] = useState<WalletPayload | null>(null);
  const [connectedWalletType, setConnectedWalletType] = useState<WalletType | null>(null);

  const disconnect = async () => {
    if (walletPayload?.disconnect) {
      await walletPayload.disconnect();
    }
    setWalletPayload(null);
    setConnectedWalletType(null);
  };

  const value = useMemo(
    () => ({
      walletPayload,
      connectedWalletType,
      setWalletPayload,
      setConnectedWalletType,
      disconnect,
    }),
    [walletPayload, connectedWalletType],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletState() {
  const context = useContext(WalletContext);

  if (context === undefined) {
    throw new Error("useWalletState must be used within a WalletProvider");
  }
  return context;
}
