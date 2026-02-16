import { NearConnector } from "@hot-labs/near-connect";
import { getNearFullAccessPublicKeys, signNearMessage } from "@idos-network/kwil-infra";
import { defineStepper } from "@stepperize/react";
import { TokenNEAR } from "@web3icons/react";
import { useEffect, useRef, useState } from "react";
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

const isTestnet = (import.meta.env.VITE_NEAR_NETWORK as "testnet" | "mainnet") === "testnet";

const connector = new NearConnector({
  features: isTestnet ? { testnet: true } : undefined,
});

export function NearWalletConnector() {
  const stepper = useStepper();
  const [accountId, setAccountId] = useState("");
  const { connectedWalletType, setWalletPayload, setConnectedWalletType } = useWalletState();
  const connectedWalletTypeRef = useRef(connectedWalletType);

  // Keep ref in sync with state for use in event handlers
  useEffect(() => {
    connectedWalletTypeRef.current = connectedWalletType;
  }, [connectedWalletType]);

  useEffect(() => {
    const handleSignIn = (event: { accounts: Array<{ accountId: string }> }) => {
      const newAccountId = event.accounts[0]?.accountId || "";
      setAccountId(newAccountId);
      setConnectedWalletType("NEAR");
      stepper.next();
    };

    const handleSignOut = () => {
      if (connectedWalletTypeRef.current === "NEAR") {
        setConnectedWalletType(null);
        setAccountId("");
        stepper.reset();
      }
    };

    connector.on("wallet:signIn", handleSignIn);
    connector.on("wallet:signOut", handleSignOut);

    return () => {
      connector.off("wallet:signIn", handleSignIn);
      connector.off("wallet:signOut", handleSignOut);
    };
  }, [stepper, setConnectedWalletType]);

  const handleSignMessage = async () => {
    const wallet = await connector.wallet();
    // biome-ignore lint/suspicious/noExplicitAny: near-connect wallet API is compatible with signNearMessage
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
    const wallet = await connector.wallet();
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
          <Button onClick={() => connector.connect()}>
            Connect with NEAR
            <TokenNEAR variant="mono" size={24} />
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
