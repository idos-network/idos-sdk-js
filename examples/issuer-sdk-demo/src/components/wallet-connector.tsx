"use client";

import { useSdkStore } from "@/stores/sdk";
import { Button } from "@nextui-org/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function WalletConnector() {
  const { isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { sdk: clientSDK } = useSdkStore();

  if (isConnected) {
    return (
      <Button
        variant="faded"
        onClick={() => {
          disconnect();
          clientSDK?.enclave.reset();
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
      onClick={() =>
        connect({
          connector: injected(),
        })
      }
    >
      Connect a wallet
    </Button>
  );
}
