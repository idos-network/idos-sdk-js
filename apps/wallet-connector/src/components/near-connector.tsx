import { signNearMessage } from "@idos-network/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { Button } from "@/components/ui/button";
import "@near-wallet-selector/modal-ui/styles.css";
import { useEffect, useState } from "react";
import { message } from "@/lib/constants";

const selector = await setupWalletSelector({
  network: import.meta.env.DEV ? "testnet" : "mainnet",
  modules: [setupMeteorWallet()],
});

const modal = setupModal(selector, {
  contractId: "",
  methodNames: [],
});

function Connector() {
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    const subscription = selector.store.observable.subscribe(() => {
      setIsConnected(selector.isSignedIn());
      const accountId = selector.store.getState().accounts[0]?.accountId || "";
      setAccountId(accountId);
    });

    return () => subscription.unsubscribe();
  }, [accountId]);

  const handleSignMessage = async () => {
    try {
      const wallet = await selector.wallet();
      const signature = await signNearMessage(wallet, message);
      console.log(signature);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisconnect = async () => {
    const wallet = await selector.wallet();
    await wallet.signOut();
  };

  if (!isConnected) {
    return (
      <Button
        variant="secondary"
        size="xl"
        onClick={() => {
          modal.show();
        }}
      >
        Connect with NEAR
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center font-bold text-2xl">Sign a message</h1>
      <p className="text-center text-muted-foreground text-sm">
        Sign this message with your wallet to prove you own it
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-center text-muted-foreground text-sm">Connected as:</p>
        <p className="text-center text-muted-foreground text-sm">{accountId}</p>
      </div>
      <Button onClick={handleSignMessage}>Sign a message</Button>
      <Button onClick={handleDisconnect}>Disconnect</Button>
    </div>
  );
}

export function NearConnector() {
  return <Connector />;
}
