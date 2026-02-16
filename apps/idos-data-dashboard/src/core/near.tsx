import { NearConnector } from "@hot-labs/near-connect";
import type { Account, NearWalletBase } from "@hot-labs/near-connect/build/types";
import type { ReactNode } from "react";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export interface WalletSelectorContextValue {
  wallet: NearWalletBase;
  connector: NearConnector;
  accounts: Array<Account>;
  accountId: string | null;
  setAccounts: (accounts: Array<Account>) => void;
}

// const contractId = import.meta.env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID;

const WalletSelectorContext = React.createContext<WalletSelectorContextValue | null>(null);

const isTestnet = import.meta.env.DEV ? "testnet" : "mainnet";

const connector = new NearConnector({
  features: isTestnet ? { testnet: true } : undefined,
  network: isTestnet ? "testnet" : "mainnet",
  logger: {
    log: (args: any) => console.log(args),
  },
});

export const WalletSelectorContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [wallet, setWallet] = useState<NearWalletBase | null>(null);
  const [accounts, setAccounts] = useState<Array<Account>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    connector.on("wallet:signIn", async (t) => {
      setWallet(await connector.wallet());
      setAccounts(t.accounts);
      setLoading(false);
    });

    connector.on("wallet:signOut", () => {
      setWallet(null);
      setAccounts([]);
    });

    connector.wallet().then(async (wallet) => {
      wallet.getAccounts().then((t) => {
        setAccounts(t);
        setWallet(wallet);
      });
    });
  }, []);

  console.log("accounts", accounts);
  console.log("wallet", wallet);
  console.log("loading", loading);

  const walletSelectorContextValue = useMemo<WalletSelectorContextValue>(
    () => ({
      // biome-ignore lint/style/noNonNullAssertion: TBD
      wallet: wallet!,
      accounts,
      connector,
      accountId: accounts?.[0]?.accountId ?? null,
      setAccounts,
    }),
    [wallet, accounts],
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="size-6" />
      </div>
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
