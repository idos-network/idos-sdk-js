"use client";

import { Button } from "@heroui/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function WalletConnector() {
  const { isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <Button
        variant="faded"
        onPress={() => {
          disconnect();
        }}
      >
        Disconnect wallet
      </Button>
    );
  }

  return (
    <Button
      variant="bordered"
      isLoading={isPending}
      onPress={() =>
        connect({
          connector: injected(),
        })
      }
    >
      Connect a wallet
    </Button>
  );
}
