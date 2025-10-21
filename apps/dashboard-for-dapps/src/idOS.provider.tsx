import { Center, Spinner, Text } from "@chakra-ui/react";
import { createIDOSClient, type idOSClient } from "@idos-network/client";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { projectId, useEthersSigner, wagmiConfig } from "@/wagmi.config";

const _idOSClient = createIDOSClient({
  nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
  enclaveOptions: {
    container: "#idOS-enclave",
    url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
  },
});

createWeb3Modal({ wagmiConfig, projectId });

export const IDOSClientContext = createContext<idOSClient>(_idOSClient);

export const useIdOS = () => use(IDOSClientContext);

export function IDOSClientProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<idOSClient>(_idOSClient);
  const [isLoading, setIsLoading] = useState(true);

  const signer = useEthersSigner();

  const initialize = useCallback(async () => {
    // we can't use client here, since if the wallet has no profile
    // it will ends up in a loop, so it's fine to use isLoading
    // as a flag that we already initialize
    if (!signer?.address || !isLoading) return;

    try {
      // Always start with a fresh client
      setIsLoading(true);
      const newClient = await _idOSClient.createClient();
      const signerSrc = {
        evm: signer,
      };

      const withSigner = await newClient.withUserSigner(signerSrc.evm);

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
  }, [client, signer]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <Center h="100%" flexDirection="column" gap="2">
        <Spinner />
        <Text>initializing idOS...</Text>
      </Center>
    );
  }

  return <IDOSClientContext value={client}>{children}</IDOSClientContext>;
}
