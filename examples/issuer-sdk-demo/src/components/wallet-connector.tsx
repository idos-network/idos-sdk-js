"use client";

import { useSdkStore } from "@/stores/sdk";
import { Button } from "@nextui-org/react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletConnector() {
  const { open } = useAppKit();
  const { isConnected } = useAccount();
  const { isPending } = useConnect();
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
    <Button variant="bordered" isLoading={isPending} onClick={() => open()}>
      Connect a wallet
    </Button>
  );
}
