"use client";

import { useWalletController } from "../wallet.provider";

interface WalletSelectorProps {
  className?: string;
}

export function WalletSelector({ className }: WalletSelectorProps) {
  const { setWalletProviderType, walletProviderType, isConnected, connect, disconnect, address } = useWalletController();

  if (isConnected) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className={`rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 ${
          className ?? ""
        }`}
      >
        Disconnect Wallet {address?.substring(0, 5)}...{address?.substring(address.length - 5)}
      </button>
    );
  }

  return (
    <div className={`flex gap-4 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => {
          setWalletProviderType("reown");
          connect();
        }}
        className={`rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 ${
          walletProviderType === "reown" ? "ring-2 ring-blue-300" : ""
        }`}
      >
        Connect with Ethereum
      </button>
      <button
        type="button"
        onClick={() => {
          setWalletProviderType("stellar");
          connect();
        }}
        className={`rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600 ${
          walletProviderType === "stellar" ? "ring-2 ring-purple-300" : ""
        }`}
      >
        Connect with Stellar
      </button>
    </div>
  );
} 