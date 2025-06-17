import type React from "react";
import { type ReactNode, Suspense, createContext, useContext, useState } from "react";
import { TokenIcon } from "@web3icons/react";

import Eth from "./eth";
import Near from "./near";
import Stellar from "./stellar";
import type { SupportedWallets, Wallet } from "./types";
import Xrp from "./xrp";
import { StellarIcon } from "./stellar/icons";

interface WalletContextType {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  connect: () => void;
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
    connect: () => {
     //  setWallets([]);
      setSelectedWallet(null);
      setCurrentType(null);
      setIsChooserOpen(true);
    },
  };

  const setType = (type: SupportedWallets) => {
    setCurrentType(type);
  };

  let modal: ReactNode;
  if (isChooserOpen && !currentType) {
    modal = (
      <>
        <h1>Wallet Chooser</h1>
        <div className="buttons-container">
          <button type="button" onClick={() => setType("eth")}>
            <TokenIcon symbol="eth" variant="branded" size="36" />
            Ethereum
          </button>
          <button type="button" onClick={() => setType("near")}>
            <TokenIcon symbol="near" variant="branded" size="36" />
            Near
          </button>
          <button type="button" onClick={() => setType("xrp")}>
            <TokenIcon symbol="xrp" variant="branded" size="36" />
            XRP
          </button>
          <button type="button" onClick={() => setType("stellar")}>
            <StellarIcon size={36} />
            Stellar
          </button>
        </div>
      </>
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
        <div className="modal-background">
          <div className="modal">
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
