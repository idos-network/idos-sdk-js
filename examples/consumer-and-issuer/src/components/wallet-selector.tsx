"use client";

import { useWalletController } from "../wallet.provider";

interface WalletSelectorProps {
  className?: string;
}

export function WalletSelector({ className }: WalletSelectorProps) {
  const { isConnected, connect, disconnect, address } = useWalletController();

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
          connect("reown");
        }}
        className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
      >
        Connect with Ethereum
      </button>
      <button
        type="button"
        onClick={() => {
          connect("stellar");
        }}
        className="rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
      >
        Connect with Stellar
      </button>
    </div>
  );
}
