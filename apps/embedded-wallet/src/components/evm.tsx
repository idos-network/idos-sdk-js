import { effect } from "@preact/signals";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit, useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { defineStepper } from "@stepperize/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TokenETH } from "@web3icons/react";
import { WagmiProvider, useSignMessage } from "wagmi";
import { connectedWalletType, message, signature } from "../state";
import { Button } from "./ui/button";

//@todo: get a new project id from reown cloud
const projectId = "4ef6d50d5abec02ac8603a7409f3b2b0";

export const networks = [mainnet, sepolia];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

const metadata = {
  name: "idOS Data Dashboard",
  description: "Add your wallet to your idOS profile",
  url: "https://localhost:5173",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sepolia],
  metadata,
  projectId,
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

const queryClient = new QueryClient();

export function EVMConnector() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <Ethereum />
      </WagmiProvider>
    </QueryClientProvider>
  );
}

function Ethereum() {
  const stepper = useStepper();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { signMessage } = useSignMessage();
  const { disconnect } = useDisconnect();

  effect(() => {
    if (isConnected && stepper.isFirst) {
      connectedWalletType.value = "evm";
      stepper.next();
    }
  });

  // Handle external disconnections
  effect(() => {
    if (!isConnected && connectedWalletType.value === "evm") {
      connectedWalletType.value = null;
      signature.value = "";
      stepper.reset();
    }
  });

  const handleSignMessage = () => {
    signMessage(
      {
        message,
      },
      {
        onSuccess: (_signature) => {
          signature.value = _signature;
        },
      },
    );
  };

  const handleDisconnect = async () => {
    await disconnect();
    connectedWalletType.value = null;
    signature.value = "";
    stepper.reset();
  };

  return (
    <div class="flex flex-col gap-2">
      {stepper.when("connect", () => (
        <div class="flex flex-col gap-4">
          <Button onClick={() => open()}>
            Connect with EVM
            <TokenETH variant="mono" size={24} />
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
