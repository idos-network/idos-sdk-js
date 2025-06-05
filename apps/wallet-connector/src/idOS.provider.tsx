import { Button, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { createIDOSClient, type idOSClient } from "@idos-network/client";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useMemo } from "react";
import type { Account, Chain, Client } from "viem";
import { type Config, type Transport, useConnectorClient } from "wagmi";
import { useWalletConnector } from "./wallet-connector.provider";

const startingConfig = createIDOSClient({
  nodeUrl: "https://nodes.staging.idos.network",
  enclaveOptions: {
    container: "#idOS-enclave",
    url: "https://enclave.staging.idos.network",
  },
});

function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}

export const IDOSClientContext = createContext<idOSClient>(startingConfig);
export const useIDOSClient = () => useContext(IDOSClientContext);

export function IDOSProvider({ children }: PropsWithChildren) {
  const [idOSClient, setIdOSClient] = useState<idOSClient>(startingConfig);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const walletConnector = useWalletConnector();
  const ethersSigner = useEthersSigner();

  const getSigner = useCallback(async () => {
    if (!walletConnector.connectedWallet) {
      return null;
    }

    switch (walletConnector.connectedWallet.type) {
      case "ethereum": {
        if (!walletConnector.ethereumWallet.isConnected) {
          throw new Error("Ethereum wallet not connected");
        }
        if (!ethersSigner) {
          return null; // Return null instead of throwing, so we can retry
        }
        return ethersSigner;
      }

      case "near": {
        if (!walletConnector.nearWallet.selector.isSignedIn()) {
          throw new Error("NEAR wallet not connected");
        }
        return await walletConnector.nearWallet.selector.wallet();
      }

      case "stellar": {
        // TODO: Implement Stellar signer for client side
        throw new Error("Stellar signer not yet implemented for client side");
      }

      default:
        throw new Error(`Unsupported wallet type: ${walletConnector.connectedWallet.type}`);
    }
  }, [
    walletConnector.connectedWallet,
    walletConnector.ethereumWallet.isConnected,
    walletConnector.nearWallet.selector,
    ethersSigner,
  ]);

  const initialize = useCallback(async () => {
    // Don't re-initialize if we're already logged in and wallet is still connected
    if (idOSClient.state === "logged-in" && walletConnector.isConnected) {
      return;
    }

    // Don't re-initialize if we're in with-user-signer state and wallet is connected
    if (
      idOSClient.state === "with-user-signer" &&
      walletConnector.isConnected &&
      hasProfile !== null
    ) {
      return;
    }

    try {
      switch (idOSClient.state) {
        case "configuration": {
          const newClient = await idOSClient.createClient();
          setIdOSClient(newClient);
          break;
        }
        case "idle": {
          if (walletConnector.isConnected) {
            const signer = await getSigner();
            if (signer) {
              const clientWithSigner = await idOSClient.withUserSigner(signer);
              setIdOSClient(clientWithSigner);
            }
          }
          break;
        }
        case "with-user-signer": {
          if (!walletConnector.isConnected) {
            setHasProfile(null);
            setIdOSClient(await idOSClient.logOut());
          } else {
            const userHasProfile = await idOSClient.hasProfile();
            setHasProfile(userHasProfile);
            if (userHasProfile) {
              const loggedInClient = await idOSClient.logIn();
              setIdOSClient(loggedInClient);
            }
          }
          break;
        }
        case "logged-in": {
          if (!walletConnector.isConnected) {
            setHasProfile(null);
            setIdOSClient(await idOSClient.logOut());
          }
          break;
        }
        default:
          assertNever(idOSClient as never);
      }
    } catch (error) {
      console.error("Failed to initialize idOS client:", error);
      // Only reset on serious errors, not on transient issues like signer not ready
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (!errorMessage.includes("signer not ready") && !errorMessage.includes("not connected")) {
        // Reset to configuration state on serious errors
        setHasProfile(null);
        setIdOSClient(
          createIDOSClient({
            nodeUrl: "https://nodes.staging.idos.network",
            enclaveOptions: {
              container: "#idOS-enclave",
              url: "https://enclave.staging.idos.network",
            },
          }),
        );
      }
    }
  }, [idOSClient, walletConnector.isConnected, getSigner, hasProfile]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Only show loading screens if we have a connected wallet but idOS is still initializing
  if (walletConnector.isConnected) {
    if (idOSClient.state === "configuration") {
      return (
        <Center h="100dvh" flexDir="column" gap="4">
          <Spinner size="xl" />
          <Text>Initializing idOS...</Text>
          <Text fontSize="sm" color="gray.500">
            State: {idOSClient.state}
          </Text>
        </Center>
      );
    }

    if (idOSClient.state === "idle") {
      return (
        <Center h="100dvh" flexDir="column" gap="4">
          <Spinner size="xl" />
          <Text>Connecting to idOS...</Text>
          <Text fontSize="sm" color="gray.500">
            State: {idOSClient.state}
          </Text>
        </Center>
      );
    }

    if (idOSClient.state === "with-user-signer") {
      if (hasProfile === null) {
        // Still checking if user has profile
        return (
          <Center h="100dvh" flexDir="column" gap="4">
            <Spinner size="xl" />
            <Text>Checking idOS profile...</Text>
            <Text fontSize="sm" color="gray.500">
              State: {idOSClient.state}
            </Text>
          </Center>
        );
      }

      if (hasProfile === false) {
        // User doesn't have a profile
        return (
          <Center h="100dvh" flexDir="column" gap="4">
            <VStack gap="4" align="center">
              <Text fontSize="xl" fontWeight="bold">
                Welcome to idOS!
              </Text>
              <Text textAlign="center" color="gray.600">
                You don't have an idOS profile yet. Create one to get started with decentralized
                identity.
              </Text>
              <Text fontSize="sm" color="gray.500">
                Wallet: {walletConnector.connectedWallet?.type.toUpperCase()}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Address: {walletConnector.connectedWallet?.address}
              </Text>
              <Text fontSize="sm" color="gray.500">
                State: {idOSClient.state} | Profile: {hasProfile ? "Yes" : "No"}
              </Text>
              <Button onClick={() => walletConnector.disconnect()} colorPalette="red" size="lg">
                Disconnect Wallet
              </Button>
            </VStack>
          </Center>
        );
      }

      // hasProfile === true, should be logging in
      return (
        <Center h="100dvh" flexDir="column" gap="4">
          <Spinner size="xl" />
          <Text>Logging into idOS...</Text>
          <Text fontSize="sm" color="gray.500">
            State: {idOSClient.state}
          </Text>
        </Center>
      );
    }
  }

  return <IDOSClientContext value={idOSClient}>{children}</IDOSClientContext>;
}

function assertNever(state: never): never {
  throw new Error(`Unexpected idOS state: ${JSON.stringify(state)}`);
}
