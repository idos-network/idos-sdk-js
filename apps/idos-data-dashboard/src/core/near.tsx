import { Center, Spinner } from "@chakra-ui/react";
import { idOS as idOSSDK } from "@idos-network/idos-sdk";
import type { AccountState, WalletSelector } from "@near-wallet-selector/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import type { ReactNode } from "react";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

interface WalletSelectorContextValue {
  selector: WalletSelector;
  modal: WalletSelectorModal;
  accounts: Array<AccountState>;
  accountId: string | null;
}

const WalletSelectorContext = React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const initialize = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: import.meta.env.DEV ? "testnet" : "mainnet",
      debug: true,
      modules: [setupMeteorWallet(), setupHereWallet()]
    });

    const _modal = setupModal(_selector, {
      contractId: idOSSDK.near.contractId,
      methodNames: idOSSDK.near.contractMethods
    });
    const state = _selector.store.getState();
    setAccounts(state.accounts);

    // this is added for debugging purpose only
    // for more information (https://github.com/near/wallet-selector/pull/764#issuecomment-1498073367)
    window.selector = _selector;
    window.modal = _modal;

    setSelector(_selector);
    setModal(_modal);
    setLoading(false);
  }, []);

  useEffect(() => {
    initialize().catch((err) => {
      console.error(err);
      alert("Failed to initialize wallet selector");
    });
  }, [initialize]);

  useEffect(() => {
    if (!selector) {
      return;
    }

    const subscription = selector.store.observable.subscribe((state) => {
      setAccounts(state.accounts);
    });

    const onHideSubscription = modal?.on("onHide", ({ hideReason }) => {
      console.log(`The reason for hiding the modal ${hideReason}`);
    });

    return () => {
      subscription.unsubscribe();
      onHideSubscription?.remove();
    };
  }, [selector, modal]);

  const walletSelectorContextValue = useMemo<WalletSelectorContextValue>(
    () => ({
      // biome-ignore lint/style/noNonNullAssertion: TBD
      selector: selector!,
      // biome-ignore lint/style/noNonNullAssertion: TBD
      modal: modal!,
      accounts,
      accountId: accounts.find((account) => account.active)?.accountId || null
    }),
    [selector, modal, accounts]
  );

  if (loading) {
    return (
      <Center h="100dvh">
        <Spinner />
      </Center>
    );
  }

  return (
    <WalletSelectorContext.Provider value={walletSelectorContextValue}>
      {children}
    </WalletSelectorContext.Provider>
  );
};

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext);

  if (!context) {
    throw new Error("useWalletSelector must be used within a WalletSelectorContextProvider");
  }

  return context;
}
