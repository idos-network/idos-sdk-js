"use client";

import { Center, Spinner, Text } from "@chakra-ui/react";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useEthersSigner } from "@/wagmi.config";
import { type idOSClient, idOSClientConfiguration } from "@idos-network/core";

const config = new idOSClientConfiguration({
  nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
  enclaveOptions: {
    container: "#idOS-enclave",
    url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
  },
});

export const idOSClientContext = createContext<idOSClient>(config);
export const useIdosClient = () => useContext(idOSClientContext);

export function IdosClientProvider({ children }: PropsWithChildren) {
  const [idOSClient, setIdosClient] = useState<idOSClient>(config);
  const signer = useEthersSigner();

  const initialize = useCallback(async () => {
    switch (idOSClient.state) {
      case "configuration":
        setIdosClient(await idOSClient.createClient());
        break;
      case "idle":
        if (signer) setIdosClient(await idOSClient.withUserSigner(signer));
        break;
      case "with-user-signer":
        if (!signer) setIdosClient(await idOSClient.logOut());
        if (await idOSClient.hasProfile()) setIdosClient(await idOSClient.logIn());
        break;
      case "logged-in":
        if (!signer) setIdosClient(await idOSClient.logOut());
        break;
      default:
        assertNever(idOSClient);
    }
  }, [idOSClient, signer]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (idOSClient.state === "configuration" || idOSClient.state === "idle") {
    return (
      <Center h="100%" flexDirection="column" gap="2">
        <Spinner />
        <Text>initializing idOS...</Text>
      </Center>
    );
  }

  return <idOSClientContext.Provider value={idOSClient}>{children}</idOSClientContext.Provider>;
}

function assertNever(state: never) {
  throw new Error(`Unexpected state: ${JSON.stringify(state)}`);
}
