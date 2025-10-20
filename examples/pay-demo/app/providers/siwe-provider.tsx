import { createContext, useContext, useState } from "react";
import { useAccount, useConnect, useSignMessage, useWalletClient } from "wagmi";
import { getAddress, type WalletClient } from "viem";

interface SiweContextType {
  address: string | null;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  walletClient: () => Promise<WalletClient>;
  signOut: () => void;
}

const SiweContext = createContext<SiweContextType | null>(null);

export function useSiwe() {
  const context = useContext(SiweContext);
  if (!context) {
    throw new Error("useSiwe must be used within a SiweProvider");
  }
  return context;
}

export function SiweProvider({ children }: { children: React.ReactNode }) {
  const { address: wagmiAddress, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { data: walletClientData } = useWalletClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signIn = async () => {
    try {
      // Connect wallet if not already connected
      let address = wagmiAddress;
      if (!isConnected) {
        const injectedConnector = connectors.find((c) => c.id === 'injected' || c.id === "walletConnect");
        if (!injectedConnector) {
          throw new Error("Please install MetaMask or another wallet");
        }
        const result = await connectAsync({ connector: injectedConnector });
        address = result.accounts[0];
      }

      if (!address) {
        throw new Error("Failed to connect wallet");
      }

      const authResponse = await fetch(`/auth?address=${getAddress(address)}`);
      const { user } = await authResponse.json();

      const signature = await signMessageAsync({
        message: user.message,
      });

      const signInResponse = await fetch("/auth", {
        method: "POST",
        body: JSON.stringify({ signature, address }),
      });

      if (signInResponse.redirected) {
        setIsAuthenticated(true);
        window.location.href = signInResponse.url;
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await fetch("/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    window.location.reload();
  };

  const walletClient = async (): Promise<WalletClient> => {
    if (!walletClientData) {
      throw new Error("Wallet client not available");
    }
    return walletClientData;
  };

  return (
    <SiweContext.Provider
      value={{
        address: wagmiAddress || null,
        isAuthenticated,
        signIn,
        signOut,
        walletClient
      }}
    >
      {children}
    </SiweContext.Provider>
  );
}
