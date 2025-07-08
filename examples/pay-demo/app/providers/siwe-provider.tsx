import { ethers, getAddress, type Signer } from "ethers";
import { createContext, useContext, useState } from "react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: "eth_requestAccounts" | "personal_sign";
        params?: [string, string];
      }) => Promise<string[] | string>;
    };
  }
}

interface SiweContextType {
  address: string | null;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signer: () => Promise<Signer>;
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
  const [address, setAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signIn = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask");
      }

      const [address] = await window.ethereum.request({ method: "eth_requestAccounts" });

      const authResponse = await fetch(`/auth?address=${getAddress(address)}`);
      const { user } = await authResponse.json();

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [user.message, address],
      });

      const signInResponse = await fetch("/auth", {
        method: "POST",
        body: JSON.stringify({ signature, address }),
      });

      if (signInResponse.redirected) {
        setAddress(address);
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
    window.location.reload();
  };

  const signer = async () => {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask");
    }
    return new ethers.BrowserProvider(window.ethereum).getSigner();
  };

  return (
    <SiweContext.Provider value={{ address, isAuthenticated, signIn, signOut, signer }}>
      {children}
    </SiweContext.Provider>
  );
}
