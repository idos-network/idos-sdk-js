import { mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit, useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineStepper } from "@stepperize/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TokenETH } from "@web3icons/react";
import { useEffect } from "react";
import { useSignMessage, WagmiProvider } from "wagmi";
import { message, useWalletState } from "../state";
import { Button } from "./ui/button";

const projectId =
  import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694";

export const networks = [mainnet, sepolia];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

const metadata = {
  name: "idOS Data Dashboard",
  description: "Add your wallet to your idOS profile",
  url: window.origin,
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
  const { disconnect: disconnectEvm } = useDisconnect();
  const { connectedWalletType, setConnectedWalletType, setWalletPayload } = useWalletState();

  useEffect(() => {
    if (isConnected && stepper.isFirst) {
      setConnectedWalletType("EVM");
      stepper.next();
    }
  }, [isConnected, stepper]);

  // Handle external disconnections
  useEffect(() => {
    if (!isConnected && connectedWalletType === "EVM") {
      setConnectedWalletType(null);
      stepper.reset();
    }
  }, [isConnected, stepper]);

  const handleSignMessage = () => {
    signMessage(
      {
        message,
      },
      {
        onSuccess: (signature) => {
          if (!address) {
            return;
          }

          setWalletPayload({
            address,
            signature,
            public_key: [],
            message,
            disconnect: disconnectEvm,
          });
        },
      },
    );
  };

  const handleDisconnect = async () => {
    await disconnectEvm();
    setConnectedWalletType(null);
    stepper.reset();
  };

  return (
    <div className="flex flex-col gap-2">
      {stepper.when("connect", () => (
        <div className="flex flex-col gap-4">
          <Button onClick={() => open()}>
            Connect with EVM
            <TokenETH variant="mono" size={24} className="ml-auto" />
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
