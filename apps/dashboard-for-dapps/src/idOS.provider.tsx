import { Center, Spinner, Text } from "@chakra-ui/react";
import { createIOSClient, type idOSClient } from "@idos-network/client-sdk-js";
import {
  type PropsWithChildren,
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useEthersSigner } from "@/wagmi.config";

function assertNever(state: never) {
  throw new Error(`Unexpected state: ${JSON.stringify(state)}`);
}

const _idOSClient = createIOSClient({
  nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
  enclaveOptions: {
    container: "#idOS-enclave",
    url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
  },
});

export const IDOSClientContext = createContext<idOSClient>(_idOSClient);

export const useIdOS = () => use(IDOSClientContext);

export function IDOSClientProvider({ children }: PropsWithChildren) {
  const initialized = useRef(false);
  const [client, setClient] = useState<idOSClient>(_idOSClient);

  const signer = useEthersSigner();

  const initialize = useCallback(async () => {
    if (initialized.current) return;

    switch (client.state) {
      case "configuration":
        setClient(await _idOSClient.createClient());

        break;
      case "idle":
        if (signer) {
          setClient(await client.withUserSigner(signer));
        }

        break;
      case "with-user-signer":
        if (!signer) {
          setClient(await client.logOut());
        }
        if (await client.hasProfile()) {
          setClient(await client.logIn());
        }

        break;
      case "logged-in":
        if (!signer) {
          setClient(await client.logOut());
        }

        initialized.current = true;
        break;
      default:
        assertNever(client);
    }
  }, [client, signer]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (client.state !== "logged-in") {
    return (
      <Center h="100%" flexDirection="column" gap="2">
        <Spinner />
        <Text>initializing idOS...</Text>
      </Center>
    );
  }

  return <IDOSClientContext value={client}>{children}</IDOSClientContext>;
}
