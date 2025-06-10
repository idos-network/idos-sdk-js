import type { Account, WalletSelector } from "@near-wallet-selector/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { signNearMessage } from "../utils/multi-chain";
window.Buffer = Buffer;

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

interface NearWalletSelector {
  selector: WalletSelector;
  modal: WalletSelectorModal;
  accounts: Array<Account>;
  accountId: string | null;
  setAccounts: (accounts: Array<Account>) => void;
  disconnect: () => Promise<void>;
  publicKey: string | null;
}

const contractId = process.env.IDOS_NEAR_DEFAULT_CONTRACT_ID ?? "idos.testnet";

export const useNearWalletSelector = () => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Array<Account>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  console.log({ publicKey });

  const initialize = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: process.env.NODE_ENV === "development" ? "testnet" : "mainnet",
      debug: true,
      modules: [setupMeteorWallet(), setupHereWallet()],
    });

    const _modal = setupModal(_selector, {
      contractId,
      methodNames: [],
    });

    // this is added for debugging purpose only
    // for more information (https://github.com/near/wallet-selector/pull/764#issuecomment-1498073367)
    window.selector = _selector;
    window.modal = _modal;

    setSelector(_selector);
    setModal(_modal);
    setLoading(false);
  }, []);

  const login = useCallback(async () => {
    if (!selector || !!publicKey) return;
    const wallet = await selector.wallet();
    if (!wallet) throw new Error("No Near wallet found");
    debugger;
    const message = "idOS authentication";
    const { publicKey: newPublicKey } = await signNearMessage(selector, Buffer.from(message));
    console.log({ newPublicKey });

    newPublicKey && setPublicKey(newPublicKey);
  }, [selector, publicKey]);

  const disconnect = useCallback(async () => {
    const wallet = await selector?.wallet();
    if (wallet) {
      await wallet.signOut();
    }
  }, [selector]);

  const setAccountsMemoized = useCallback((accounts: Array<Account>) => {
    setAccounts(accounts);
  }, []);

  const accountId = useMemo(() => accounts?.[0]?.accountId ?? null, [accounts]);

  useEffect(() => {
    initialize().catch((err) => {
      console.error(err);
      alert("Failed to initialize wallet selector");
    });
  }, [initialize]);
  console.log({ selector });

  useEffect(() => {
    if (!selector) {
      return;
    }
    const subscription = selector.on("signedIn", ({ accounts }) => {
      setAccounts(accounts);
      setTimeout(() => {
        login().catch((err) => {
          console.error(err);
        });
      }, 500);
    });

    const onHideSubscription = modal?.on("onHide", ({ hideReason }) => {
      console.log(`The reason for hiding the modal ${hideReason}`);
    });

    return () => {
      subscription.remove();
      onHideSubscription?.remove();
    };
  }, [selector, modal, login]);

  const walletSelectorValue = useMemo<NearWalletSelector>(
    () => ({
      // biome-ignore lint/style/noNonNullAssertion: TBD
      selector: selector!,
      // biome-ignore lint/style/noNonNullAssertion: TBD
      modal: modal!,
      accounts,
      accountId,
      setAccounts: setAccountsMemoized,
      disconnect,
      publicKey,
    }),
    [selector, modal, accounts, accountId, setAccountsMemoized, disconnect, publicKey],
  );

  return walletSelectorValue;
};
