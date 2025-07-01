import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { effect, useSignal } from "@preact/signals";
import { defineStepper } from "@stepperize/react";
import { TokenNEAR } from "@web3icons/react";
import { message, signature } from "../state";
import { Button } from "./ui/button";

//@todo: get a new project id from reown cloud

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
  network: import.meta.env.DEV ? "testnet" : "mainnet",
  modules: [setupMeteorWallet(), setupHereWallet()],
});

const modal = setupModal(selector, {
  contractId: "",
  methodNames: [],
});

export function NearConnector() {
  const stepper = useStepper();
  const isSignedIn = useSignal(false);

  effect(() => {
    if (isSignedIn.value && stepper.isFirst) {
      stepper.next();
    }

    const subscription = selector.store.observable.subscribe(() => {
      isSignedIn.value = selector.isSignedIn();
    });

    return () => subscription.unsubscribe();
  });

  const handleSignMessage = async () => {
    const wallet = await selector.wallet();
    const signedMessage = await wallet.signMessage({
      message: message,
      recipient: "idos.network",
      nonce: Buffer.from(message.substring(0, 32)),
    });

    if (signedMessage) {
      signature.value = signedMessage.signature;
    }
  };

  const handleDisconnect = async () => {
    const wallet = await selector.wallet();
    await wallet.signOut();
    stepper.reset();
  };

  return (
    <div class="flex max-w-xl flex-col gap-2">
      {stepper.when("connect", () => (
        <div class="flex flex-col gap-4">
          <Button onClick={() => modal.show()}>
            Connect with NEAR
            <TokenNEAR variant="mono" size={24} />
          </Button>
        </div>
      ))}
      {stepper.when("sign-message", (step) => (
        <div class="flex flex-col gap-4">
          <h1 class="text-center font-bold text-2xl">{step.title}</h1>
          <p class="text-center text-neutral-400 text-sm">{step.description}</p>
          <div class="flex flex-col gap-2">
            <p class="text-center text-neutral-400 text-sm">Connected as:</p>
            <p class="text-center text-neutral-400 text-sm">TODO</p>
          </div>
          <Button onClick={handleSignMessage}>Sign a message</Button>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </div>
      ))}
    </div>
  );
}
