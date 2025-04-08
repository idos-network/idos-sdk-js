"use client";

import { Button } from "@heroui/react";
import { useAppKit } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function WalletConnector() {
  const { isConnected, address } = useAccount();
  const { connectAsync, isPending } = useConnect();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <Button
          color="danger"
          onPress={() => {
            disconnect();
            router.replace("/");
          }}
        >
          Disconnect wallet
        </Button>
      </div>
    );
  }

  return (
    <Button
      color="secondary"
      isLoading={isPending}
      onPress={async () => {
        open();
        router.replace("/onboarding");
      }}
    >
      Get Started now
    </Button>
  );
}
