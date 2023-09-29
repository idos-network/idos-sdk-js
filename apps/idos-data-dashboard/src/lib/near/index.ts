import { KeyPairEd25519 } from "@near-js/crypto";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { binary_to_base58 } from "base58-js";
import { atom, useAtomValue } from "jotai";
import { InMemorySigner } from "near-api-js";

import { deriveKeyPairAuth } from "@/lib/encryption";

export async function setupMyNearWalletSelector() {
  const selector = await setupWalletSelector({
    network: "testnet",
    modules: [setupMyNearWallet()],
  });
  return selector;
}

export async function setupNear(password: string) {
  const ws = await setupMyNearWalletSelector();
  const { accountId } = ws.store.getState().accounts[0];
  const derivedAuth = await deriveKeyPairAuth(password);
  const keyPair = new KeyPairEd25519(binary_to_base58(derivedAuth.secretKey));
  const signer = await InMemorySigner.fromKeyPair("testnet", accountId, keyPair);
  const publicKey = keyPair.getPublicKey().toString();
  return {
    accountId,
    publicKey,
    signer,
  };
}

const walletSelectorAtom = atom(async () => await setupMyNearWalletSelector());
const signedInAtom = atom(async (get) => (await get(walletSelectorAtom)).isSignedIn());

export function useNearSignedIn() {
  return useAtomValue(signedInAtom);
}
