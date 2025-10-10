import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import {
  FREIGHTER_ID,
  FreighterModule,
  StellarWalletsKit,
  WalletNetwork,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";
import { hexEncode } from "@idos-network/utils/codecs";
import { StrKey } from "@stellar/stellar-base";
import { defineStepper } from "@stepperize/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TokenXLM } from "@web3icons/react";
import { useEffect, useState } from "preact/hooks";
import { connectedWalletType, message, walletPayload } from "../state";
import { Button } from "./ui/button";

export const stellarKit: StellarWalletsKit = new StellarWalletsKit({
  network:
    import.meta.env.VITE_STELLAR_TESTNET === "true" ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC,
  selectedWalletId: FREIGHTER_ID,
  modules: [new FreighterModule(), new xBullModule()],
});

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

const derivePublicKey = async (address: string) => {
  if (!address) throw new Error("Address is required");
  return Buffer.from(StrKey.decodeEd25519PublicKey(address)).toString("hex");
};

const queryClient = new QueryClient();

export function StellarConnector() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stellar />
    </QueryClientProvider>
  );
}

function Stellar() {
  const stepper = useStepper();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!address && connectedWalletType.value === "stellar") {
      connectedWalletType.value = null;
      stepper.reset();
    }
  }, [address, stepper]);

  const handleSignMessage = async () => {
    if (!address || !publicKey) return;

    const result = await stellarKit.signMessage(message);
    // Signed message is string in base64, but we need to return hex
    const signature = hexEncode(Buffer.from(result.signedMessage, "base64"));
    console.log("SIGNATURE", signature);
    walletPayload.value = {
      address,
      signature,
      public_key: [publicKey],
      message,
      disconnect: disconnectStellar,
    };
  };

  const handleConnect = async () => {
    try {
      await stellarKit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          stellarKit.setWallet(option.id);
          const { address } = await stellarKit.getAddress();
          const publicKey = await derivePublicKey(address);
          setAddress(address);
          setPublicKey(publicKey);
          connectedWalletType.value = "stellar";
          stepper.next();
        },
      });
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const disconnectStellar = async () => {
    await stellarKit.disconnect();
  };

  const handleDisconnect = async () => {
    setAddress(null);
    setPublicKey(null);
    await disconnectStellar();
    connectedWalletType.value = null;
    stepper.reset();
  };

  return (
    <div class="flex flex-col gap-2">
      {stepper.when("connect", () => (
        <div class="flex flex-col gap-4">
          <Button onClick={handleConnect}>
            Connect with Stellar
            <TokenXLM variant="mono" size={24} />
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
