import type { WalletSelector } from "@near-wallet-selector/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";

const contractId = "contract.id.idos.near";

let selector: WalletSelector | null = null;
let modal: WalletSelectorModal | null = null;

export const getNearModal = async (): Promise<WalletSelectorModal> => {
  if (modal) return modal;
  const _selector = await setupWalletSelector({
    network: process.env.NODE_ENV === "development" ? "testnet" : "mainnet",
    debug: true,
    modules: [setupMeteorWallet(), setupHereWallet()],
  });

  const _modal = setupModal(_selector, {
    contractId,
    methodNames: [],
  });
  selector = _selector;
  modal = _modal;
  return _modal;
};
