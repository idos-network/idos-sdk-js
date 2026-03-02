import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { getNearFullAccessPublicKeys, signNearMessage } from "@idos-network/kwil-infra";
import { defineStepper } from "@stepperize/react";
import { TokenNEAR } from "@web3icons/react";
import { useEffect, useState } from "react";
import { message, useWalletState } from "../state";
import { Button } from "./ui/button";

const { useStepper } = defineStepper(
  {
    id: "connect",
    title: "Connect your wallet",
    description: "Connect the wallet you want to add to your idOS profile",
  },
  {
    id: "sign-message",
    title: "Sign a message",
    description: "Sign a message with your wallet to prove you own it",
  },
);

const selector = await setupWalletSelector({
  network: (import.meta.env.VITE_NEAR_NETWORK as "testnet" | "mainnet") || "testnet",
  // biome-ignore lint/suspicious/noExplicitAny: false positive
  modules: [setupMeteorWallet() as any],
});

const modal = setupModal(selector, {
  contractId: "",
  methodNames: [],
});

export function NearConnector() {
  const stepper = useStepper();
  const [isSignedIn, setSignedIn] = useState(false);
  const [accountId, setAccountId] = useState("");
  const { connectedWalletType, setWalletPayload, setConnectedWalletType } = useWalletState();

  useEffect(() => {
    if (isSignedIn && stepper.isFirst) {
      setConnectedWalletType("NEAR");
      stepper.next();
    }
  }, [isSignedIn, stepper]);

  useEffect(() => {
    const subscription = selector.store.observable.subscribe(() => {
      setSignedIn(selector.isSignedIn());
      setAccountId(selector.store.getState().accounts[0]?.accountId || "");

      // Handle external disconnections
      if (!selector.isSignedIn() && connectedWalletType === "NEAR") {
        setConnectedWalletType(null);
        setAccountId("");
        stepper.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [stepper, accountId, isSignedIn]);

  const handleSignMessage = async () => {
    const wallet = await selector.wallet();
    // biome-ignore lint/suspicious/noExplicitAny: false positive
    const signature = await signNearMessage(wallet as any, message);

    if (signature) {
      setWalletPayload({
        address: accountId,
        signature,
        public_key: (await getNearFullAccessPublicKeys(accountId)) || [],
        message,
        disconnect: disconnectNear,
      });
    }
  };

  const disconnectNear = async () => {
    const wallet = await selector.wallet();
    await wallet.signOut();
  };

  const handleDisconnect = async () => {
    await disconnectNear();
    setConnectedWalletType(null);
    setAccountId("");
    stepper.reset();
  };

  return (
    <div className="flex max-w-xl flex-col gap-2">
      {stepper.when("connect", () => (
        <div className="flex flex-col gap-4">
          <Button onClick={() => modal.show()}>
            Connect with NEAR
            <TokenNEAR variant="mono" size={24} className="ml-auto" />
          </Button>
        </div>
      ))}
      {stepper.when("sign-message", (step) => (
        <div className="flex flex-col gap-4">
          <h1 className="text-center font-bold text-2xl">{step.title}</h1>
          <p className="text-center text-neutral-400 text-sm">{step.description}</p>
          <div className="flex flex-col gap-2">
            <p className="text-center text-neutral-400 text-sm">Connected as:</p>
            <p className="text-center text-neutral-400 text-sm">{accountId}</p>
          </div>
          <Button onClick={handleSignMessage}>Sign a message</Button>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </div>
      ))}
    </div>
  );
}
