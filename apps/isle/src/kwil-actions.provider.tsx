import {
  type KwilActionClient,
  createWebKwilClient,
} from "@idos-network/kwil-actions/create-kwil-client";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type KwilActionsContextType = {
  client: KwilActionClient;
};

// biome-ignore lint/style/noNonNullAssertion: it is initialised in the provider
const KwilActionsContext = createContext<KwilActionsContextType>(null!);

export function KwilActionsProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<KwilActionClient | null>(null);

  const initialiseKwilClient = useCallback(async () => {
    const _client = await createWebKwilClient({
      nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
    });

    setClient(_client);
  }, []);

  useEffect(() => {
    initialiseKwilClient();
  }, [initialiseKwilClient]);

  if (!client) {
    return null;
  }

  return <KwilActionsContext.Provider value={{ client }}>{children}</KwilActionsContext.Provider>;
}

export function useKwilActionsClient() {
  const context = useContext(KwilActionsContext);
  if (!context) {
    throw new Error("`useKwilActionsClient` must be used within a `KwilActionsProvider`");
  }
  return context;
}
