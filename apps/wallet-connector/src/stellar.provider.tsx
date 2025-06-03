import { Center, Spinner, Text } from "@chakra-ui/react";
import {
  FREIGHTER_ID,
  type ISupportedWallet,
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
} from "@creit.tech/stellar-wallets-kit";
import type { PropsWithChildren } from "react";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    stellarKit: StellarWalletsKit;
  }
}

interface StellarWalletContextValue {
  kit: StellarWalletsKit;
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
}

const STELLAR_NETWORK = import.meta.env.DEV ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC;

const StellarWalletContext = React.createContext<StellarWalletContextValue | null>(null);

export function useStellarWallet() {
  const context = useContext(StellarWalletContext);

  if (!context) {
    throw new Error("`useStellarWallet` must be used within a `StellarWalletProvider`");
  }

  return context;
}

export function StellarWalletProvider({ children }: PropsWithChildren) {
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initializeStellarKit = useCallback(async () => {
    try {
      const stellarKit = new StellarWalletsKit({
        network: STELLAR_NETWORK,
        selectedWalletId: FREIGHTER_ID,
        modules: allowAllModules(),
      });

      setKit(stellarKit);

      const storedAddress = localStorage.getItem("stellar-address");
      const storedWalletId = localStorage.getItem("stellar-wallet-id");

      if (storedAddress && storedWalletId) {
        setAddress(storedAddress);
        setIsConnected(true);
        // Restored Stellar wallet connection (will validate on use)
      }
    } catch (error) {
      console.error("Failed to initialize Stellar Wallets Kit:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeStellarKit().catch((error) => {
      console.error("Stellar kit initialization failed:", error);
    });
  }, [initializeStellarKit]);

  const connect = useCallback(async () => {
    if (!kit) {
      throw new Error("Stellar kit not initialized");
    }

    try {
      setIsLoading(true);
      await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          kit.setWallet(option.id);
          const { address: walletAddress } = await kit.getAddress();

          setAddress(walletAddress);
          setIsConnected(true);
          localStorage.setItem("stellar-address", walletAddress);
          localStorage.setItem("stellar-wallet-id", option.id);

          // Connected to Stellar wallet
        },
        onClosed: (error?: Error) => {
          if (error) {
            console.error("Modal closed with error:", error);
          }
        },
      });
    } catch (error) {
      console.error("Failed to connect to Stellar wallet:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [kit]);

  const disconnect = useCallback(async () => {
    // Clear local state - most Stellar wallets don't support programmatic disconnection
    setAddress(null);
    setIsConnected(false);
    localStorage.removeItem("stellar-address");
    localStorage.removeItem("stellar-wallet-id");
  }, []);

  const signTransaction = useCallback(
    async (xdr: string) => {
      if (!kit || !isConnected || !address) {
        throw new Error("Stellar wallet not connected");
      }

      try {
        const { signedTxXdr } = await kit.signTransaction(xdr, {
          address,
          networkPassphrase: STELLAR_NETWORK,
        });

        return signedTxXdr;
      } catch (error) {
        console.error("Failed to sign transaction:", error);
        throw error;
      }
    },
    [kit, isConnected, address],
  );

  const contextValue = useMemo<StellarWalletContextValue | null>(() => {
    if (!kit) {
      return null;
    }

    return {
      kit,
      address,
      isConnected,
      isLoading,
      connect,
      disconnect,
      signTransaction,
    };
  }, [kit, address, isConnected, isLoading, connect, disconnect, signTransaction]);

  if (isLoading) {
    return (
      <Center h="100dvh">
        <Spinner />
      </Center>
    );
  }

  if (!contextValue) {
    return (
      <Center h="100dvh">
        <Text>Failed to initialize Stellar</Text>
      </Center>
    );
  }

  return <StellarWalletContext value={contextValue}>{children}</StellarWalletContext>;
}

export type { StellarWalletContextValue };
