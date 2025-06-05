import { type PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useAppKitWallet } from "./appkit.provider";
import { useNearWallet } from "./near.provider";
import { useStellarWallet } from "./stellar.provider";

export type WalletType = "ethereum" | "near" | "stellar";

export interface ConnectedWallet {
  type: WalletType;
  address: string;
  disconnect: () => Promise<void> | void;
}

export interface WalletConnectorContextValue {
  connectedWallet: ConnectedWallet | null;
  isConnected: boolean;

  connectEthereum: () => Promise<void>;
  connectNear: () => Promise<void>;
  connectStellar: () => Promise<void>;

  disconnect: () => Promise<void>;

  ethereumWallet: ReturnType<typeof useAppKitWallet>;
  nearWallet: ReturnType<typeof useNearWallet>;
  stellarWallet: ReturnType<typeof useStellarWallet>;
}

export const WalletConnectorContext = createContext<WalletConnectorContextValue | null>(null);

export function useWalletConnector() {
  const context = useContext(WalletConnectorContext);

  if (!context) {
    throw new Error("`useWalletConnector` must be used within a `WalletConnectorProvider`");
  }

  return context;
}

export function WalletConnectorProvider({ children }: PropsWithChildren) {
  const ethereumWallet = useAppKitWallet();
  const nearWallet = useNearWallet();
  const stellarWallet = useStellarWallet();

  const contextValue = useMemo<WalletConnectorContextValue>(() => {
    const disconnectAll = async () => {
      const promises: Promise<void>[] = [];

      if (ethereumWallet.isConnected) {
        promises.push(Promise.resolve(ethereumWallet.disconnect()));
      }

      if (nearWallet.selector.isSignedIn()) {
        promises.push(nearWallet.selector.wallet().then((wallet) => wallet.signOut()));
      }

      if (stellarWallet.isConnected) {
        promises.push(Promise.resolve(stellarWallet.disconnect()));
      }

      await Promise.all(promises);
    };
    let connectedWallet: ConnectedWallet | null = null;

    if (ethereumWallet.isConnected && ethereumWallet.address) {
      connectedWallet = {
        type: "ethereum",
        address: ethereumWallet.address,
        disconnect: ethereumWallet.disconnect,
      };
    } else if (nearWallet.selector.isSignedIn() && nearWallet.accountId) {
      connectedWallet = {
        type: "near",
        address: nearWallet.accountId,
        disconnect: async () => {
          const wallet = await nearWallet.selector.wallet();
          await wallet.signOut();
        },
      };
    } else if (stellarWallet.isConnected && stellarWallet.address) {
      connectedWallet = {
        type: "stellar",
        address: stellarWallet.address,
        disconnect: stellarWallet.disconnect,
      };
    }

    return {
      connectedWallet,
      isConnected: connectedWallet !== null,

      connectEthereum: async () => {
        await disconnectAll();
        ethereumWallet.connect();
      },
      connectNear: async () => {
        await disconnectAll();
        nearWallet.modal.show();
      },
      connectStellar: async () => {
        await disconnectAll();
        await stellarWallet.connect();
      },

      disconnect: disconnectAll,

      ethereumWallet,
      nearWallet,
      stellarWallet,
    };
  }, [ethereumWallet, nearWallet, stellarWallet]);

  return <WalletConnectorContext value={contextValue}>{children}</WalletConnectorContext>;
}
