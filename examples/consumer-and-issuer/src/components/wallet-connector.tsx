"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function WalletConnector() {
  const { isConnected, address } = useAccount();
  const { connectAsync, isPending } = useConnect();
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
        await connectAsync({
          connector: injected(),
        });
        router.replace("/onboarding");
      }}
    >
      Get Started now
    </Button>
  );
}
