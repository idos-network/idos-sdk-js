import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useStorageContext } from "./storage";
import { HDNodeWallet, Wallet } from "ethers";

export interface SessionProposal {
  id: number;
  metadata: {
    name: string;
    description: string;
  }
}

export interface SignProposal {
  id: number;
  data: string;
  metadata: {
    name: string;
    description: string;
  }
}

export interface WalletContextValue {
  address: string | null;
  sessionProposals: SessionProposal[];
  signProposals: SignProposal[];
  sign: (data: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [sessionProposals, setSessionProposals] = useState<SessionProposal[]>([]);
  const [signProposals, setSignProposals] = useState<SignProposal[]>([]);
  const { entropy } = useStorageContext();
  const [wallet, setWallet] = useState<HDNodeWallet | null>(null);

  const navigate = useNavigate();

  // Placeholder values and functions
  const contextValue: WalletContextValue = {
    address: null,
    sessionProposals,
    signProposals,
    sign: async (data: string) => {
      if (!wallet) {
        throw new Error("Wallet not initialized");
      }
      const signature = await wallet.signMessage(data);
      return signature;
    },
  };

  // Initialize wallet connection logic here
  useEffect(() => {
    // Bind events from parent window
    const handler = (event: any) => {
      console.log(event);

      const { type, data } = event.data;
      if (type === "session_proposal") {
        console.log("Received session proposal:", data);
        setSessionProposals((prev) => [...prev, data]);
        navigate("/session");
      } else if (type === "sign_proposal") {
        console.log("Received sign proposal:", data);
        setSignProposals((prev) => [...prev, data]);
        navigate("/sign");
      }
    }

    window.addEventListener("message", handler);

    setInitialized(true);

    return () => {
      window.removeEventListener("message", handler);
    }
  }, []);

  useEffect(() => {
    if (entropy && !wallet) {
      setWallet(Wallet.fromPhrase(entropy));
    }
  }, [entropy, wallet]);

  if (!initialized) {
    return <div>Loading Wallet...</div>;
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletContextProvider");
  }
  return context;
}

