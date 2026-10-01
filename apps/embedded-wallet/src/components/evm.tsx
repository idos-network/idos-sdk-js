import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit, useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { defineStepper } from "@stepperize/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TokenETH } from "@web3icons/react";
import { useEffect, useRef } from "react";
import { useSignMessage, WagmiProvider } from "wagmi";

import { shouldAdvanceAfterConnect } from "../fresh-connection";
import { requestChainSignMessage } from "../request-chain-message";
import { useWalletState } from "../state";
import { COMMON_ENV } from "./envFlags.common";
import { Button } from "./ui/button";

const projectId = COMMON_ENV.WALLET_CONNECT_PROJECT_ID;

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
  enableCoinbase: false,
  enableReconnect: false,
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
      <WagmiProvider config={wagmiAdapter.wagmiConfig} reconnectOnMount={false}>
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
  const userAskedToConnect = useRef(false);
  const wasConnected = useRef(isConnected);

  useEffect(() => {
    const advance = shouldAdvanceAfterConnect({
      armed: userAskedToConnect.current,
      wasConnected: wasConnected.current,
      connected: isConnected,
    });
    wasConnected.current = isConnected;
    if (advance && stepper.isFirst) {
      setConnectedWalletType("EVM");
      stepper.next();
    }
  }, [isConnected, stepper, setConnectedWalletType]);

  // Handle external disconnections
  useEffect(() => {
    if (!isConnected && connectedWalletType === "EVM") {
      setConnectedWalletType(null);
      stepper.reset();
    }
  }, [isConnected, stepper]);

  const handleConnect = async () => {
    if (isConnected) {
      await disconnectEvm();
    }
    userAskedToConnect.current = true;
    open();
  };

  const handleSignMessage = async () => {
    if (!address) return;
    try {
      const chain = await requestChainSignMessage({ address, walletType: "EVM" });
      signMessage(
        { message: chain.message },
        {
          onSuccess: (signature) => {
            setWalletPayload({
              address,
              signature,
              public_key: [],
              message: chain.message,
              not_before: chain.notBefore,
              not_after: chain.notAfter,
              attemptId: chain.attemptId,
              disconnect: disconnectEvm,
            });
          },
        },
      );
    } catch (error) {
      console.error("Failed to load add-wallet message", error);
    }
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
          <Button onClick={handleConnect}>
            Connect with EVM
            <TokenETH variant="mono" size={24} className="ml-auto" />
          </Button>
        </div>
      ))}
      {stepper.when("sign-message", (step) => (
        <div className="flex flex-col gap-4">
          <h1 className="text-center text-2xl font-bold">{step.title}</h1>
          <p className="text-center text-sm text-neutral-400">{step.description}</p>
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-neutral-400">Connected as:</p>
            <p className="text-center text-sm text-neutral-400">{address}</p>
          </div>
          <Button onClick={handleSignMessage}>Sign a message</Button>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </div>
      ))}
    </div>
  );
}
