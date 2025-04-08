"use client";

import { Button } from "@heroui/react";
import { useConnectWallet } from "@privy-io/react-auth";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletConnector() {
  const { isConnected } = useAccount();
  const { isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { connectWallet: connectPrivy } = useConnectWallet();

  if (isConnected) {
    return (
      <Button
        onPress={() => {
          disconnect();
        }}
      >
        Disconnect wallet
      </Button>
    );
  }

  return (
    <Button isLoading={isPending} onPress={() => connectPrivy()}>
      Connect a wallet
    </Button>
  );
}
