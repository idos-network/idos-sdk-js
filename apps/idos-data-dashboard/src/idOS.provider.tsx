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
  useState,
} from "react";

import { useEthersSigner } from "@/core/wagmi";
import * as GemWallet from "@gemwallet/api";
import invariant from "tiny-invariant";
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

export const IDOSClientContext = createContext<idOSClient>(_idOSClient);

export const useIdOS = () => {
  const context = use(IDOSClientContext);
  invariant(context.state === "logged-in", "`idOSClient` not initialized");
  return context;
};

export const useUnsafeIdOS = () => {
  return use(IDOSClientContext);
};

export function IDOSClientProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<idOSClient>(_idOSClient);
  const { signer: evmSigner } = useSigner();
  const { accountId, selector } = useWalletSelector();
  const { walletType, walletAddress } = useWalletStore();

  useEffect(() => {
    // @todo: make sure when switching wallet (not idos registered wallet) the client stays on main wallet
    if (!walletType) {
      setIsLoading(false);
      return;
    }
    const setupClient = async () => {
      try {
        // Always start with a fresh client
        setIsLoading(true);
        const newClient = await _idOSClient.createClient();
        if (!walletAddress || !walletAddress) {
          setClient(newClient);
          setIsLoading(false);
          return;
        }
        const nearSigner = accountId ? await selector.wallet() : undefined;

        const signerSrc = {
          evm: evmSigner,
          near: nearSigner,
          xrpl: GemWallet,
        };

        const withSigner = await newClient.withUserSigner(
          signerSrc[walletType as "evm" | "near" | "xrpl"],
        );

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
  }, [evmSigner, accountId, selector, walletType, walletAddress]);

  // While loading, show a spinner
  if (isLoading) {
    return (
      <Center h="100dvh">
        <Spinner />
      </Center>
    );
  }

  // If no signer is available, show the connect wallet screen
  if (!walletType || !walletAddress) {
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
