"use client";

import * as GemWallet from "@gemwallet/api";
import { Button } from "@heroui/react";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function WalletConnector() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { isConnected: evmConnected } = useAppKitAccount();
  const { isConnecting } = useAccount();
  const [xrpConnected, setXrpConnected] = useState(false);
  const walletConnected = evmConnected || xrpConnected;

  useEffect(() => {
    GemWallet.isInstalled().then((res) => {
      if (res.result.isInstalled) {
        GemWallet.getAddress().then((res) => {
          setXrpConnected(!!res.result?.address);
        });
      }
    });
  }, []);

  useEffect(() => {
    if (walletConnected) {
      router.replace("/onboarding");
    } else {
      router.replace("/");
    }
  }, [walletConnected, router]);

  if (walletConnected) {
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
        // @todo: to be decided when creating a multi chain selector UI
        await open();
      }}
    >
      Get Started now
    </Button>
  );
}
