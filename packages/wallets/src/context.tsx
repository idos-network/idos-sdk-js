import type React from "react";
import { type ReactNode, Suspense, createContext, useContext, useState } from "react";

import type { SupportedWallets, Wallet } from "./types";
import Eth from "./eth";
import Stellar from "./stellar";
import Xrp from "./xrp";
import Near from "./near";

interface WalletContextType {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  start: () => void;
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
    start: () => {
      setWallets([]);
      setSelectedWallet(null);
      setCurrentType(null);
      setIsChooserOpen(true);
    }
  };

  console.log("-> isChooserOpen", isChooserOpen);
  console.log("-> currentType", currentType);

  const setType = (type: SupportedWallets) => {
    setCurrentType(type);
  };

  let modal: ReactNode;
  if (isChooserOpen && !currentType) {
    modal = (
      <div>
        <h1>Wallet Chooser</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button type="button" onClick={() => setType("eth")}>Ethereum</button>
          <button type="button" onClick={() => setType("near")}>Near</button>
          <button type="button" onClick={() => setType("xrp")}>XRP</button>
          <button type="button" onClick={() => setType("stellar")}>Stellar</button>
        </div>
      </div>
    );
  }

  const addWallets = (newWallets: Wallet[]) => {
    setWallets([...wallets, ...newWallets]);

    if (wallets.length === 0 && newWallets.length > 0) {
      setSelectedWallet(newWallets[0]);
    }

    setIsChooserOpen(false);
  };

  if (currentType === "eth" && isChooserOpen) {
    modal = (
      <Suspense fallback={<div>Loading wallet...</div>}>
        <Eth addWallets={addWallets} />
      </Suspense>
    );
  }

  if (currentType === "stellar" && isChooserOpen) {
    modal = (
      <Suspense fallback={<div>Loading wallet...</div>}>
        <Stellar addWallets={addWallets} />
      </Suspense>
    );
  }

  if (currentType === "xrp" && isChooserOpen) {
    modal = (
      <Suspense fallback={<div>Loading wallet...</div>}>
        <Xrp addWallets={addWallets} />
      </Suspense>
    );
  }

  if (currentType === "near" && isChooserOpen) {
    modal = (
      <Suspense fallback={<div>Loading wallet...</div>}>
        <Near addWallets={addWallets} />
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
