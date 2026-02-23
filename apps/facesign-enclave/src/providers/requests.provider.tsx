import { useRouter } from "@tanstack/react-router";
import { createContext, use, useCallback, useEffect, useRef, useState } from "react";
import { type BaseHandler, WindowMessageHandler } from "@/lib/window";

export interface SessionProposal {
  id: number;
  metadata: {
    name: string;
    description: string;
  };
  callback: (approved: boolean, address?: string) => void;
}

export interface SignProposal {
  id: number;
  data: Uint8Array;
  metadata: {
    name: string;
    description: string;
  };
  callback: (signature: Uint8Array | null) => void;
}

export interface RequestsContextValue {
  sessionProposals: SessionProposal[];
  signProposals: SignProposal[];
}

const RequestsContext = createContext<RequestsContextValue | undefined>(undefined);

export function RequestsContextProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  const handlers = useRef<BaseHandler[]>([]);

  const [sessionProposals, setSessionProposals] = useState<SessionProposal[]>([]);
  const [signProposals, setSignProposals] = useState<SignProposal[]>([]);

  const router = useRouter();

  // Placeholder values and functions
  const contextValue: RequestsContextValue = {
    sessionProposals,
    signProposals,
  };

  const addSessionProposal = useCallback(
    (proposal: SessionProposal) => {
      const originalCallback = proposal.callback;
      proposal.callback = (approved: boolean, address?: string) => {
        originalCallback(approved, address);
        setSessionProposals((prev) => prev.filter((p) => p !== proposal));
      };
      setSessionProposals((prev) => [...prev, proposal]);
      router.navigate({ to: "/session" });
    },
    [router],
  );

  const addSignProposal = useCallback(
    (proposal: SignProposal) => {
      const originalCallback = proposal.callback;
      proposal.callback = (signature: Uint8Array | null) => {
        originalCallback(signature);
        setSignProposals((prev) => prev.filter((p) => p !== proposal));
      };
      setSignProposals((prev) => [...prev, proposal]);
      router.navigate({ to: "/sign" });
    },
    [router],
  );

  // Initialize handlers to receive proposals
  useEffect(() => {
    // Example: Initialize a WindowMessageHandler
    handlers.current.push(new WindowMessageHandler(addSignProposal, addSessionProposal));

    // Initialize all handlers
    Promise.allSettled(handlers.current.map((handler) => handler.init())).then(() => {
      setInitialized(true);
    });

    return () => {
      handlers.current.forEach((handler) => {
        handler.destruct();
      });
    };
  }, []);

  if (!initialized) {
    return <div>Loading Requests...</div>;
  }

  return <RequestsContext value={contextValue}>{children}</RequestsContext>;
}

export function useRequests() {
  const context = use(RequestsContext);

  if (!context) {
    throw new Error("`useRequests` must be used within a RequestsContextProvider");
  }

  return context;
}
