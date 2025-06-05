import { Center, Spinner, Text } from "@chakra-ui/react";
import type { Account, WalletSelector } from "@near-wallet-selector/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import type { PropsWithChildren } from "react";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    nearSelector: WalletSelector;
    nearModal: WalletSelectorModal;
  }
}

interface NearWalletContextValue {
  selector: WalletSelector;
  modal: WalletSelectorModal;
  accounts: Account[];
  accountId: string | null;
  setAccounts: (accounts: Account[]) => void;
  isLoading: boolean;
}

const NearWalletContext = React.createContext<NearWalletContextValue | null>(null);

export function useNearWallet() {
  const context = useContext(NearWalletContext);

  if (!context) {
    throw new Error("`useNearWallet` must be used within a `NearWalletProvider`");
  }

  return context;
}

export function NearWalletProvider({ children }: PropsWithChildren) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initializeWalletSelector = useCallback(async () => {
    try {
      const walletSelector = await setupWalletSelector({
        network: import.meta.env.DEV ? "testnet" : "mainnet",
        debug: import.meta.env.DEV,
        modules: [setupMeteorWallet()],
      });

      const walletModal = setupModal(walletSelector, {
        contractId: "",
        methodNames: [],
      });

      setSelector(walletSelector);
      setModal(walletModal);

      // Check for existing accounts on initialization (for page refresh)
      if (walletSelector.isSignedIn()) {
        try {
          const wallet = await walletSelector.wallet();
          const existingAccounts = await wallet.getAccounts();
          setAccounts(existingAccounts);
        } catch (error) {
          console.error("Failed to restore existing accounts:", error);
        }
      }

      // Store in global scope for debugging
      if (typeof window !== "undefined") {
        window.nearSelector = walletSelector;
        window.nearModal = walletModal;
      }
    } catch (error) {
      console.error("Failed to initialize NEAR wallet selector:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeWalletSelector().catch((error) => {
      console.error("Wallet selector initialization failed:", error);
      alert("Failed to initialize wallet selector. Please refresh the page.");
    });
  }, [initializeWalletSelector]);

  useEffect(() => {
    if (!selector || !modal) {
      return;
    }

    const signInSubscription = selector.on("signedIn", ({ accounts: signedInAccounts }) => {
      setAccounts(signedInAccounts);
    });

    const signOutSubscription = selector.on("signedOut", () => {
      setAccounts([]);
    });

    return () => {
      signInSubscription.remove();
      signOutSubscription.remove();
    };
  }, [selector, modal]);

  const contextValue = useMemo<NearWalletContextValue | null>(() => {
    if (!selector || !modal) {
      return null;
    }

    return {
      selector,
      modal,
      accounts,
      accountId: accounts[0]?.accountId ?? null,
      setAccounts,
      isLoading,
    };
  }, [selector, modal, accounts, isLoading]);

  if (isLoading) {
    return (
      <Center h="100dvh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!contextValue) {
    return (
      <Center h="100dvh">
        <Text>Failed to initialize Near</Text>
      </Center>
    );
  }

  return <NearWalletContext value={contextValue}>{children}</NearWalletContext>;
}

export type { NearWalletContextValue };
