import * as GemWallet from "@gemwallet/api";
import { getGemWalletPublicKey, signGemWalletTx } from "@idos-network/core";
import { defineStepper } from "@stepperize/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TokenXRP } from "@web3icons/react";
import { useEffect, useState } from "preact/hooks";
import { connectedWalletType, message, walletPayload } from "../state";
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

  useEffect(() => {
    if (!address && connectedWalletType.value === "xrpl") {
      connectedWalletType.value = null;
      stepper.reset();
    }
  }, [address, stepper]);

  const handleSignMessage = async () => {
    const signature = await signGemWalletTx(GemWallet, message);

    if (!address || !signature || !publicKey) return;

    walletPayload.value = {
      address,
      signature,
      public_key: [publicKey ?? ""],
      message,
    };
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

      connectedWalletType.value = "xrpl";
      stepper.next();
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const handleDisconnect = async () => {
    setAddress(null);
    setPublicKey(null);
    connectedWalletType.value = null;
    stepper.reset();
  };

  return (
    <div class="flex flex-col gap-2">
      {stepper.when("connect", () => (
        <div class="flex flex-col gap-4">
          <Button onClick={handleConnect}>
            Connect with XRP
            <TokenXRP variant="mono" size={24} />
          </Button>
        </div>
      ))}
      {stepper.when("sign-message", (step) => (
        <div class="flex flex-col gap-4">
          <h1 class="text-center font-bold text-2xl">{step.title}</h1>
          <p class="text-center text-neutral-400 text-sm">{step.description}</p>
          <div class="flex flex-col gap-2">
            <p class="text-center text-neutral-400 text-sm">Connected as:</p>
            <p class="text-center text-neutral-400 text-sm">{address}</p>
          </div>
          <Button onClick={handleSignMessage}>Sign a message</Button>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </div>
      ))}
    </div>
  );
}
