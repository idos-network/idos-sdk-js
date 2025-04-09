"use client";

import { Button } from "@heroui/react";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";

export function WalletConnector() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { isConnected, isPending } = useAppKitAccount();

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
    <Button isLoading={isPending} onPress={() => open()}>
      Connect a wallet
    </Button>
  );
}
