import { Center, Spinner, Text } from "@chakra-ui/react";
import { type idOSClient, idOSClientConfiguration } from "@idos-network/core";
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
import invariant from "tiny-invariant";

import { useEthersSigner } from "@/core/wagmi";
import { ConnectWallet } from "./connect-wallet";
import { useWalletSelector } from "./core/near";

function assertNever(state: never) {
  throw new Error(`Unexpected state: ${JSON.stringify(state)}`);
}

const _idOSClient = new idOSClientConfiguration({
  nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
  enclaveOptions: {
    container: "#idOS-enclave",
    url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
  },
});

const useSigner = () => {
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

    return;
  }, [ethSigner, selector]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return signer;
};

export const IDOSClientContext = createContext<idOSClient>(_idOSClient);

export const useIdOS = () => {
  const context = use(IDOSClientContext);
  invariant(context.state === "logged-in", "`idOSClient` not initialized");
  return context;
};

export function IDOSClientProvider({ children }: PropsWithChildren) {
  const initialized = useRef(false);
  const [client, setClient] = useState<idOSClient>(_idOSClient);
  const signer = useSigner();

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
      <Center h="100dvh" flexDirection="column" gap="2">
        <Spinner />
        <Text>initializing idOS...</Text>
      </Center>
    );
  }

  return <IDOSClientContext value={client}>{children}</IDOSClientContext>;
}
