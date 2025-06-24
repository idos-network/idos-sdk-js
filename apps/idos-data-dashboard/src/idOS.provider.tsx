import { Center, Spinner, Text } from "@chakra-ui/react";
import { type idOSClient, idOSClientConfiguration } from "@idos-network/client";
import type { Wallet } from "@near-wallet-selector/core";
import type { SignMessageMethod } from "@near-wallet-selector/core/src/lib/wallet";
import type { JsonRpcSigner } from "ethers";
import {
  type PropsWithChildren,
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { useEthersSigner } from "@/core/wagmi";
import * as GemWallet from "@gemwallet/api";
import Layout from "./components/layout";
import { ConnectWallet } from "./connect-wallet";
import { useWalletSelector } from "./core/near";
import { useWalletStore } from "./stores/wallet";

const _idOSClient = new idOSClientConfiguration({
  nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
  enclaveOptions: {
    container: "#idOS-enclave",
    url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
  },
});

export const useSigner = () => {
  const [signer, setSigner] = useState<(Wallet & SignMessageMethod) | JsonRpcSigner | undefined>(
    undefined,
  );
  const ethSigner = useEthersSigner();
  const { selector } = useWalletSelector();

  const initialize = useCallback(async () => {
    if (selector.isSignedIn()) {
      setSigner(await selector.wallet());
      return;
    }

    if (ethSigner) {
      setSigner(ethSigner);
      return;
    }

    setSigner(undefined);
  }, [ethSigner, selector]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return { signer, setSigner };
};

export const IDOSClientContext = createContext<idOSClient | null>(null);

export const useIdOS = () => {
  const context = use(IDOSClientContext);
  if (!context) {
    throw new Error(
      "idOSClient context not found. Make sure you're using this hook within IDOSClientProvider.",
    );
  }
  return context;
};

export const useUnsafeIdOS = () => {
  return use(IDOSClientContext);
};

export function IDOSClientProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<idOSClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { signer: evmSigner } = useSigner();
  const { accountId, selector } = useWalletSelector();
  const { walletType, walletAddress } = useWalletStore();
  const location = useLocation();
  const enhanceClientRef = useRef<AbortController | null>(null);

  // Check if we're on the add wallet route
  const isAddWalletRoute = location.pathname.includes("/wallets/add");

  // Initialize basic client immediately
  useEffect(() => {
    const initBasicClient = async () => {
      try {
        const basicClient = await _idOSClient.createClient();
        setClient(basicClient);
      } catch (error) {
        console.error("Failed to create basic idOS client:", error);
        setClient(null);
      } finally {
        setIsLoading(false);
      }
    };

    initBasicClient();
  }, []);

  // Enhance client with signer when available
  useEffect(() => {
    if (!client || !walletType || !walletAddress) {
      return;
    }

    // Cancel any ongoing enhancement operation
    if (enhanceClientRef.current) {
      enhanceClientRef.current.abort();
    }

    const abortController = new AbortController();
    enhanceClientRef.current = abortController;

    const enhanceClient = async () => {
      try {
        console.log("Enhancing client with wallet type:", walletType);

        const nearSigner = accountId ? await selector.wallet() : undefined;

        const signerSrc = {
          evm: evmSigner,
          near: nearSigner,
          xrpl: GemWallet,
        };

        const selectedSigner = signerSrc[walletType as "evm" | "near" | "xrpl"];

        if (!selectedSigner) {
          console.warn(`No signer available for wallet type: ${walletType}`);
          return;
        }

        // Check if operation was cancelled
        if (abortController.signal.aborted) {
          return;
        }

        // Check if the client has the withUserSigner method
        if ("withUserSigner" in client && typeof client.withUserSigner === "function") {
          const withSigner = await client.withUserSigner(selectedSigner);

          // Check if operation was cancelled
          if (abortController.signal.aborted) {
            return;
          }

          // Check if the user has a profile and log in if they do
          if (await withSigner.hasProfile()) {
            console.log("User has profile, logging in");
            const loggedInClient = await withSigner.logIn();

            // Check if operation was cancelled before setting state
            if (!abortController.signal.aborted) {
              setClient(loggedInClient);
            }
          } else {
            console.log("User has no profile, setting client with signer");

            // Check if operation was cancelled before setting state
            if (!abortController.signal.aborted) {
              setClient(withSigner);
            }
          }
        } else {
          console.warn("Client does not have withUserSigner method");
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Failed to enhance idOS client:", error);
        }
      }
    };

    enhanceClient();

    // Cleanup function
    return () => {
      if (enhanceClientRef.current) {
        enhanceClientRef.current.abort();
        enhanceClientRef.current = null;
      }
    };
  }, [client, evmSigner, accountId, selector, walletType, walletAddress]);

  // Always provide the client context, even if it's null
  const contextValue = client;

  // While loading, show a spinner
  if (isLoading) {
    return (
      <IDOSClientContext.Provider value={contextValue}>
        <Center h="100dvh">
          <Spinner />
        </Center>
      </IDOSClientContext.Provider>
    );
  }

  // If no wallet is connected, show connect wallet screen
  if (!walletType || !walletAddress) {
    return (
      <IDOSClientContext.Provider value={contextValue}>
        <ConnectWallet />
      </IDOSClientContext.Provider>
    );
  }

  // If client is not logged in, handle based on route
  if (client && client.state !== "logged-in") {
    if (isAddWalletRoute) {
      // Allow add wallet route to proceed
      return (
        <IDOSClientContext.Provider value={contextValue}>{children}</IDOSClientContext.Provider>
      );
    }

    // For other routes, show no account found
    return (
      <IDOSClientContext.Provider value={contextValue}>
        <Layout hasAccount={false}>
          <Text>No account found</Text>
        </Layout>
      </IDOSClientContext.Provider>
    );
  }

  // Normal case - render children
  return <IDOSClientContext.Provider value={contextValue}>{children}</IDOSClientContext.Provider>;
}
