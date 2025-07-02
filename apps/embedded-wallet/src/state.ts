import { signal } from "@preact/signals";

export type WalletPayload = {
  address: string;
  signature: string;
  public_key: string[];
  message: string;
};
export type WalletType = "evm" | "near" | "xrpl" | "stellar" | null;

export const walletPayload = signal<WalletPayload | null>(null);
export const message = "Sign this message to prove you own this wallet";

// Wallet connection state
export const connectedWalletType = signal<WalletType>(null);
