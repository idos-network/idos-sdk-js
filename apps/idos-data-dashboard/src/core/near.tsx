import { Center, Spinner } from "@chakra-ui/react";
import type { Account } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import Naxios from "@wpdas/naxios";
import type { ReactNode } from "react";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";

type WalletSelector = ReturnType<typeof naxiosInstance.walletApi>["walletSelector"];

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

interface WalletSelectorContextValue {
  selector: WalletSelector | null;
  accounts: Array<Account>;
  accountId: string | null;
  walletApi: Awaited<ReturnType<typeof naxiosInstance.walletApi>> | null;
}

const contractId = import.meta.env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID;
const network = import.meta.env.VITE_IDOS_NEAR_DEFAULT_NETWORK ?? "testnet";

export const naxiosInstance = new Naxios({
  contractId,
  network,
  walletSelectorModules: [setupMeteorWallet(), setupHereWallet()],
});

export const WalletSelectorContext = React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [accounts, setAccounts] = useState<Array<Account>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [walletApi, setWalletApi] = useState<Awaited<
    ReturnType<typeof naxiosInstance.walletApi>
  > | null>(null);

  const initialize = useCallback(async () => {
    const walletApi = await naxiosInstance.walletApi();
    setSelector(walletApi.walletSelector);
    setWalletApi(walletApi);

    // this is added for debugging purpose only
    // for more information (https://github.com/near/wallet-selector/pull/764#issuecomment-1498073367)
    setLoading(false);
  }, []);

  useEffect(() => {
    initialize().catch((err) => {
      console.error(err);
      alert("Failed to initialize wallet selector");
    });
  }, [initialize]);

  useEffect(() => {
    if (!walletApi) {
      return;
    }
    const onConnectedSubscription = walletApi?.walletSelector.on("signedIn", ({ accounts }) => {
      console.log("Wallet connected:", accounts);
      setAccounts(accounts);
      setWalletApi(naxiosInstance.walletApi());
    });

    const onDisconnectedSubscription = walletApi?.walletSelector.on("signedOut", () => {
      console.log("Wallet disconnected");
      setAccounts([]);
    });

    return () => {
      onConnectedSubscription?.remove();
      onDisconnectedSubscription?.remove();
    };
  }, [walletApi]);

  const walletSelectorContextValue = useMemo<WalletSelectorContextValue>(
    () => ({
      selector,
      accounts,
      accountId: accounts.find((account) => account.accountId)?.accountId || null,
      walletApi,
    }),
    [accounts, selector, walletApi],
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
