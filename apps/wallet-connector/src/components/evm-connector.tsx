import { mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit, useAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useDisconnect, useSignMessage, WagmiProvider } from "wagmi";
import { Button } from "@/components/ui/button";
import { message } from "@/lib/constants";

const projectId =
  import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694";

export const networks = [mainnet, sepolia];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

const metadata = {
  name: "idOS Wallet Connector",
  description: "Add your wallet to your idOS profile",
  url: window.origin,
  icons: ["/favicon.svg"],
};

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sepolia],
  metadata,
  projectId,
  enableCoinbase: false,
  features: {
    socials: false,
    email: false,
  },
});

const queryClient = new QueryClient();

function Connector() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const { disconnectAsync } = useDisconnect();

  const handleSignMessage = async () => {
    try {
      const signature = await signMessageAsync({ message });
      console.log(signature);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectAsync();
  };

  if (!isConnected) {
    return (
      <Button
        variant="secondary"
        size="xl"
        onClick={() => {
          open();
        }}
      >
        Connect with EVM
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center font-bold text-2xl">Sign a message</h1>
      <p className="text-center text-muted-foreground text-sm">
        Sign this message with your wallet to prove you own it
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-center text-muted-foreground text-sm">Connected as:</p>
        <p className="text-center text-muted-foreground text-sm">{address}</p>
      </div>
      <Button onClick={handleSignMessage}>Sign a message</Button>
      <Button onClick={handleDisconnect}>Disconnect</Button>
    </div>
  );
}

export function EVMConnector() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <Connector />
      </WagmiProvider>
    </QueryClientProvider>
  );
}
