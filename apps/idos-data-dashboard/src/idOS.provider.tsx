import { Center, Spinner, Text } from "@chakra-ui/react";
import { type idOSClient, idOSClientConfiguration } from "@idos-network/core";
import type { Wallet } from "@near-wallet-selector/core";
import type { JsonRpcSigner } from "ethers";
import {
  type PropsWithChildren,
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useEthersSigner } from "@/core/wagmi";
import invariant from "tiny-invariant";
import Layout from "./components/layout";
import { ConnectWallet } from "./connect-wallet";
import { useWalletSelector } from "./core/near";

const _idOSClient = new idOSClientConfiguration({
  nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
  enclaveOptions: {
    container: "#idOS-enclave",
    url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
  },
});

export const useSigner = () => {
  const [signer, setSigner] = useState<Wallet | JsonRpcSigner | undefined>(undefined);
  const ethSigner = useEthersSigner();
  const { selector } = useWalletSelector();

  const initialize = useCallback(async () => {
    if (selector?.isSignedIn()) {
      const wallet = await selector.wallet();
      setSigner(wallet as Wallet);
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

export const IDOSClientContext = createContext<idOSClient>(_idOSClient);

export const useIdOS = () => {
  const context = use(IDOSClientContext);
  invariant(context.state === "logged-in", "`idOSClient` not initialized");
  return context;
};

export function IDOSClientProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<idOSClient>(_idOSClient);
  const context = useWalletSelector();
  const { signer } = useSigner();

  useEffect(() => {
    const setupClient = async () => {
      setIsLoading(true);

      try {
        // Always start with a fresh client
        const newClient = await _idOSClient.createClient();
        const hasSigner = signer || !!context.accounts.length;

        const wallet = (await context.selector?.wallet()) as Wallet;
        if (!hasSigner) {
          setClient(newClient);
          setIsLoading(false);
          return;
        }
        invariant(signer || wallet, "Neither signer nor wallet found");
        // Add the signer to the client

        const withSigner = await newClient.withUserSigner(signer ? signer : wallet);

        // Check if the user has a profile and log in if they do
        if (await withSigner.hasProfile()) {
          setClient(await withSigner.logIn());
        } else {
          setClient(withSigner);
        }
      } catch (error) {
        console.error("Failed to initialize idOS client:", error);
        const newClient = await _idOSClient.createClient();
        setClient(newClient);
      } finally {
        setIsLoading(false);
      }
    };

    setupClient();
  }, [signer, context.accounts, context.selector]);

  // While loading, show a spinner
  if (isLoading) {
    return (
      <Center h="100dvh">
        <Spinner />
      </Center>
    );
  }
  console.log({ signer, context: context.accounts });

  // If no signer is available, show the connect wallet screen
  if (!signer && !context.accounts.length) {
    return <ConnectWallet />;
  }

  // If the client is not logged in, show a spinner
  if (client.state !== "logged-in") {
    return (
      <Layout hasAccount={false}>
        <Text>No account found</Text>
      </Layout>
    );
  }

  // Otherwise, render the children with the client context
  return <IDOSClientContext.Provider value={client}>{children}</IDOSClientContext.Provider>;
}
