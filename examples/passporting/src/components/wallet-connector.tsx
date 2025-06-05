"use client";

import { useNearWallet } from "@/near.provider";
import { Button } from "@heroui/react";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { useAccount } from "wagmi";

export function WalletConnector() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAppKitAccount();
  const { isConnecting } = useAccount();
  const nearWallet = useNearWallet();

  if (isConnected || nearWallet.selector.isSignedIn()) {
    return (
      <Button
        onPress={async () => {
          if (isConnected) {
            disconnect();
            return;
          }

          const wallet = await nearWallet.selector.wallet();
          await wallet.signOut();
        }}
      >
        Disconnect wallet
      </Button>
    );
  }

  return (
    <div className="flex flex-col place-content-center gap-4">
      <Button isLoading={isConnecting} onPress={() => open()}>
        Connect with Reown
      </Button>
      <Button isLoading={isConnecting} onPress={() => nearWallet.modal.show()}>
        Connect with NEAR
      </Button>
    </div>
  );
}
