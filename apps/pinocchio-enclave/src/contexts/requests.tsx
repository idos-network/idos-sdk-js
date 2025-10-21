import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useStorageContext } from "./storage";
import { type HDNodeWallet, Wallet } from "ethers";

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

export interface RequestsContextValue {
  sessionProposals: SessionProposal[];
  signProposals: SignProposal[];
}

const RequestsContext = createContext<RequestsContextValue | undefined>(undefined);

export function RequestsContextProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  const [sessionProposals, setSessionProposals] = useState<SessionProposal[]>([]);
  const [signProposals, setSignProposals] = useState<SignProposal[]>([]);

  // Placeholder values and functions
  const contextValue: RequestsContextValue = {
    sessionProposals,
    signProposals,
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
    return <div>Loading Requests...</div>;
  }

  return (
    <RequestsContext.Provider value={contextValue}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const context = useContext(RequestsContext);

  if (!context) {
    throw new Error("useRequests must be used within a RequestsContextProvider");
  }

  return context;
}

