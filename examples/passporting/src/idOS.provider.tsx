"use client";

import { CircularProgress } from "@heroui/react";
import { type idOSClient, idOSClientConfiguration } from "@idos-network/client";
import type { Wallet as NearWallet } from "@near-wallet-selector/core";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useEthersSigner } from "@/wagmi.config";
import type { JsonRpcSigner } from "ethers";
import { useNearWallet } from "./near.provider";

const startingConfig = new idOSClientConfiguration({
  nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL ?? "",
  enclaveOptions: {
    container: "#idOS-enclave",
    url: process.env.NEXT_PUBLIC_IDOS_ENCLAVE_URL ?? "",
  },
});

const useSigner = () => {
  const ethersSigner = useEthersSigner();
  const nearWallet = useNearWallet();
  const [signer, setSigner] = useState<JsonRpcSigner | NearWallet | undefined>(undefined);

  useEffect(() => {
    async function initialise() {
      console.log("useSigner initializing...", {
        ethersSigner: !!ethersSigner,
        nearWalletExists: !!nearWallet,
        nearSelectorExists: !!nearWallet?.selector,
        nearIsLoading: nearWallet?.isLoading,
        nearIsSignedIn: nearWallet?.selector?.isSignedIn?.(),
        nearAccounts: nearWallet?.accounts,
        nearAccountId: nearWallet?.accountId,
      });

      // Wait for NEAR wallet to finish loading
      if (nearWallet?.isLoading) {
        console.log("NEAR wallet still loading, waiting...");
        return;
      }

      // If neither wallet is connected, clear the signer
      if (!ethersSigner && !nearWallet?.selector?.isSignedIn()) {
        console.log("No wallets connected, clearing signer");
        setSigner(undefined);
        return;
      }

      try {
        // Prioritize NEAR wallet if signed in
        if (nearWallet?.selector?.isSignedIn()) {
          console.log("NEAR wallet is signed in, getting wallet...");
          const nearSigner = await nearWallet.selector.wallet();
          console.log("NEAR signer obtained:", !!nearSigner);
          setSigner(nearSigner);
          return;
        }

        // Otherwise use Ethereum signer if available
        if (ethersSigner) {
          console.log("Using Ethereum signer...");
          const ethSigner = await ethersSigner.provider.getSigner();
          console.log("Ethereum signer obtained:", !!ethSigner);
          setSigner(ethSigner);
        } else {
          console.log("No signers available, clearing");
          setSigner(undefined);
        }
      } catch (error) {
        console.error("Error initializing signer:", error);
        setSigner(undefined);
      }
    }

    initialise();
  }, [
    ethersSigner,
    nearWallet,
    nearWallet?.accounts,
    nearWallet?.accountId,
    nearWallet?.isLoading,
  ]);

  console.log("useSigner hook returning:", {
    signerExists: !!signer,
    signerType: signer?.constructor?.name,
    timestamp: Date.now(),
  });

  return signer;
};

export const IDOSClientContext = createContext<idOSClient>(startingConfig);
export const useIDOSClient = () => useContext(IDOSClientContext);

export function IDOSClientProvider({ children }: PropsWithChildren) {
  const [idOSClient, setIdosClient] = useState<idOSClient>(startingConfig);
  const signer = useSigner();
  const isInitializing = useRef(false);

  console.log("IDOSClientProvider render:", {
    clientState: idOSClient.state,
    signerExists: !!signer,
    signerType: signer?.constructor?.name,
    timestamp: Date.now(),
  });

  // Track signer changes
  useEffect(() => {
    console.log("Signer changed in IDOSClientProvider:", {
      signerExists: !!signer,
      signerType: signer?.constructor?.name,
      signerValue: signer,
      clientState: idOSClient.state,
      timestamp: Date.now(),
    });
  }, [signer, idOSClient.state]);

  const initialize = useCallback(async () => {
    // Prevent concurrent initialization
    if (isInitializing.current) {
      return;
    }

    isInitializing.current = true;

    try {
      const currentClient = idOSClient;
      switch (currentClient.state) {
        case "configuration":
          console.log("Creating idOS client...");
          setIdosClient(await currentClient.createClient());
          break;

        case "idle":
          console.log("IDLE CASE - Signer status:", signer ? "Available" : "Not available", {
            signerExists: !!signer,
            signerType: signer?.constructor?.name,
            signerDetails: signer ? Object.keys(signer) : null,
            signerValue: signer,
            timestamp: Date.now(),
          });
          if (signer) {
            console.log("Setting user signer...");
            setIdosClient(await currentClient.withUserSigner(signer));
          } else {
            console.log("No signer available, staying in idle state");
          }
          break;

        case "with-user-signer":
          console.log("WITH-USER-SIGNER CASE - Processing...", {
            signerExists: !!signer,
            signerType: signer?.constructor?.name,
            timestamp: Date.now(),
          });

          if (!signer) {
            console.log("No signer available, logging out...");
            setIdosClient(await currentClient.logOut());
          } else {
            console.log("Checking if user has profile...");
            const hasProfile = await currentClient.hasProfile();
            console.log("Profile check result:", hasProfile);

            if (hasProfile) {
              console.log("Profile found, logging in...");
              setIdosClient(await currentClient.logIn());
            } else {
              console.log("No profile found, staying in with-user-signer state");
            }
          }
          break;

        case "logged-in":
          if (!signer) {
            console.log("Signer lost, logging out...");
            setIdosClient(await currentClient.logOut());
          }
          break;

        default:
          assertNever(currentClient);
      }
    } catch (error) {
      console.error("Error during idOS client initialization:", error);
      // On error, try to reset to a clean state
      try {
        setIdosClient(await startingConfig.createClient());
      } catch (resetError) {
        console.error("Failed to reset idOS client:", resetError);
      }
    } finally {
      isInitializing.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, idOSClient.state]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (idOSClient.state !== "logged-in" && idOSClient.state !== "with-user-signer") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 px-6">
        <CircularProgress aria-label="initializing idOS..." />
        <p>initializing idOS...</p>
        <p className="text-sm text-gray-500">State: {idOSClient.state}</p>
      </div>
    );
  }

  return <IDOSClientContext.Provider value={idOSClient}>{children}</IDOSClientContext.Provider>;
}

function assertNever(state: never): never {
  throw new Error(`Unexpected state: ${JSON.stringify(state)}`);
}
