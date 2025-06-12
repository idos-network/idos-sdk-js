import type React from "react";
import { type ReactNode, Suspense, createContext, lazy, useContext, useState } from "react";

import type { SupportedWallets, Wallet } from "./types";

// Lazy load the Eth component with artificial delay for testing
const Eth = lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((resolve) => {
      setTimeout(() => {
        resolve(import("./eth"));
      }, 2000); // 2 second delay
    }),
);

interface WalletContextType {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  openChooser: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
}: WalletProviderProps) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [currentType, setCurrentType] = useState<SupportedWallets | null>(null);

  const value = {
    wallets,
    selectedWallet,
    openChooser: () => setIsChooserOpen(true),
  };

  console.log("-> isChooserOpen", isChooserOpen);
  console.log("-> currentType", currentType);

  const setType = (type: SupportedWallets) => {
    setCurrentType(type);
    setIsChooserOpen(false);
  };

  let modal;

  if (isChooserOpen) {
    modal = (
      <div>
        <h1>Wallet Chooser</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={() => setType("eth")}>Ethereum</button>
          <button onClick={() => setType("near")}>Near</button>
          <button onClick={() => setType("xrp")}>XRP</button>
          <button onClick={() => setType("stellar")}>Stellar</button>
        </div>
      </div>
    );
  }

  if (currentType) {
    modal = (
      <Suspense fallback={<div>Loading wallet...</div>}>
        <Eth />
      </Suspense>
    );
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
      {modal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              margin: "auto",
              width: "300px",
              height: "150px",
              backgroundColor: "white",
            }}
          >
            {modal}
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
};

export const useWalletChooser = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletChooser must be used within a WalletProvider");
  }
  return context;
};
