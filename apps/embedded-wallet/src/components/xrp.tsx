import * as GemWallet from "@gemwallet/api";
import { getGemWalletPublicKey, signGemWalletTx } from "@idos-network/kwil-infra/xrp-utils";
import { defineStepper } from "@stepperize/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TokenXRP } from "@web3icons/react";
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

const queryClient = new QueryClient();

export function XRPLConnector() {
  return (
    <QueryClientProvider client={queryClient}>
      <XRPL />
    </QueryClientProvider>
  );
}

function XRPL() {
  const stepper = useStepper();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const { connectedWalletType, setConnectedWalletType, setWalletPayload } = useWalletState();

  useEffect(() => {
    if (!address && connectedWalletType === "XRPL") {
      setConnectedWalletType(null);
      stepper.reset();
    }
  }, [address, stepper]);

  const handleSignMessage = async () => {
    const signature = await signGemWalletTx(GemWallet, message);

    if (!address || !signature || !publicKey) return;

    setWalletPayload({
      address,
      signature,
      public_key: [publicKey ?? ""],
      message,
      // No need to disconnect xrpl wallet (it does not possess a persistent connection)
      disconnect: () => Promise.resolve(),
    });
  };

  const handleConnect = async () => {
    try {
      const installed = await GemWallet.isInstalled();

      if (!installed?.result?.isInstalled) throw new Error("GemWallet is not installed");

      const result = await getGemWalletPublicKey(GemWallet);

      if (!result) throw new Error("Failed to get wallet info");

      const { publicKey: pk, address: addr } = result;

      setPublicKey(pk);
      setAddress(addr);
      setConnectedWalletType("XRPL");
      stepper.next();
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const handleDisconnect = async () => {
    setAddress(null);
    setPublicKey(null);
    setConnectedWalletType(null);
    stepper.reset();
  };

  return (
    <div className="flex flex-col gap-2">
      {stepper.when("connect", () => (
        <div className="flex flex-col gap-4">
          <Button onClick={handleConnect}>
            Connect with XRP
            <TokenXRP variant="mono" size={24} className="ml-auto" />
          </Button>
        </div>
      ))}
      {stepper.when("sign-message", (step) => (
        <div className="flex flex-col gap-4">
          <h1 className="text-center font-bold text-2xl">{step.title}</h1>
          <p className="text-center text-neutral-400 text-sm">{step.description}</p>
          <div className="flex flex-col gap-2">
            <p className="text-center text-neutral-400 text-sm">Connected as:</p>
            <p className="text-center text-neutral-400 text-sm">{address}</p>
          </div>
          <Button onClick={handleSignMessage}>Sign a message</Button>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </div>
      ))}
    </div>
  );
}
