"use client";

import { Button } from "@heroui/react";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { useAccount } from "wagmi";

export function WalletConnector() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAppKitAccount();
  const { isConnecting } = useAccount();

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
    <Button isLoading={isConnecting} onPress={() => open()}>
      Connect a wallet
    </Button>
  );
}
