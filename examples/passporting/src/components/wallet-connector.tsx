"use client";

import { Button } from "@heroui/react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function WalletConnector() {
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

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
