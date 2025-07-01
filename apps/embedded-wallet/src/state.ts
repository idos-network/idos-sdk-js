import { signal } from "@preact/signals";

export const signature = signal("");
export const message = "Sign this message to prove you own this wallet";

// Wallet connection state
export type WalletType = "evm" | "near" | null;
export const connectedWalletType = signal<WalletType>(null);
