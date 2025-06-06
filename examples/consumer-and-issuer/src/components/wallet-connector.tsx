"use client";

import { Button } from "@heroui/react";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export function WalletConnector() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const { isConnecting } = useAccount();

  useEffect(() => {
    if (isConnected) {
      router.replace("/onboarding");
    } else {
      router.replace("/");
    }
  }, [isConnected, router]);

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <Button
          color="danger"
          onPress={() => {
            disconnect();
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
      isLoading={isConnecting}
      onPress={async () => {
        await open();
      }}
    >
      Get Started now
    </Button>
  );
}
