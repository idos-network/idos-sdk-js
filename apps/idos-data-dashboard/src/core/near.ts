import type { WalletSelector } from "@near-wallet-selector/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { COMMON_ENV } from "./envFlags.common";

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

const contractId = COMMON_ENV.IDOS_NEAR_DEFAULT_CONTRACT_ID;

let _selector: WalletSelector | null = null;
let _modal: WalletSelectorModal | null = null;

export async function initializeNearSelector(): Promise<WalletSelector> {
  if (_selector) {
    return _selector;
  }

  _selector = await setupWalletSelector({
    network: COMMON_ENV.DEV ? "testnet" : "mainnet",
    debug: COMMON_ENV.DEV,
    modules: [setupMeteorWallet(), setupHereWallet()],
  });

  _modal = setupModal(_selector, {
    contractId,
    methodNames: [],
  });

  if (COMMON_ENV.DEV) {
    window.selector = _selector;
    window.modal = _modal;
  }

  return _selector;
}

export function getNearSelector(): WalletSelector | null {
  return _selector;
}

export function getNearModal(): WalletSelectorModal | null {
  return _modal;
}

export function openNearModal(selector?: WalletSelector): void {
  if (!_modal && selector) {
    _modal = setupModal(selector, {
      contractId,
      methodNames: [],
    });
  }
  _modal?.show();
}
