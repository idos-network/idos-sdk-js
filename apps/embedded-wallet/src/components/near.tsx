import { getNearFullAccessPublicKeys, signNearMessage } from "@idos-network/kwil-infra";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import "@near-wallet-selector/modal-ui/styles.css";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { defineStepper } from "@stepperize/react";
import { TokenNEAR } from "@web3icons/react";
import { useEffect, useRef, useState } from "react";

import { currentSignMessage } from "../add-wallet-request";
import { shouldAdvanceAfterConnect } from "../fresh-connection";
import { useWalletState } from "../state";
import { COMMON_ENV } from "./envFlags.common";
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
  network: COMMON_ENV.NEAR_NETWORK,
  debug: COMMON_ENV.NODE_ENV === "development",
  // oxlint-disable-next-line typescript/no-explicit-any -- false positive
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
  const userAskedToConnect = useRef(false);
  const wasConnected = useRef(isSignedIn);

  useEffect(() => {
    const advance = shouldAdvanceAfterConnect({
      armed: userAskedToConnect.current,
      wasConnected: wasConnected.current,
      connected: isSignedIn,
    });
    wasConnected.current = isSignedIn;
    if (advance && stepper.isFirst) {
      setConnectedWalletType("NEAR");
      stepper.next();
    }
  }, [isSignedIn, stepper, setConnectedWalletType]);

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
    // oxlint-disable-next-line typescript/no-explicit-any -- false positive
    const signature = await signNearMessage(wallet as any, currentSignMessage());

    if (signature) {
      setWalletPayload({
        address: accountId,
        signature,
        public_key: (await getNearFullAccessPublicKeys(accountId)) || [],
        message: currentSignMessage(),
        disconnect: disconnectNear,
      });
    }
  };

  const disconnectNear = async () => {
    const wallet = await selector.wallet();
    await wallet.signOut();
  };

  const handleConnect = async () => {
    if (selector.isSignedIn()) {
      const wallet = await selector.wallet();
      await wallet.signOut();
    }
    userAskedToConnect.current = true;
    modal.show();
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
          <Button onClick={handleConnect}>
            Connect with NEAR
            <TokenNEAR variant="mono" size={24} className="ml-auto" />
          </Button>
        </div>
      ))}
      {stepper.when("sign-message", (step) => (
        <div className="flex flex-col gap-4">
          <h1 className="text-center text-2xl font-bold">{step.title}</h1>
          <p className="text-center text-sm text-neutral-400">{step.description}</p>
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-neutral-400">Connected as:</p>
            <p className="text-center text-sm text-neutral-400">{accountId}</p>
          </div>
          <Button onClick={handleSignMessage}>Sign a message</Button>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </div>
      ))}
    </div>
  );
}
