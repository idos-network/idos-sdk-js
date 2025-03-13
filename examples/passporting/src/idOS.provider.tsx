"use client";

import { Button, CircularProgress, Link } from "@heroui/react";
import {
  type ConsumerConfig,
  checkUserProfile,
  createConsumerConfig,
} from "@idos-network/consumer-sdk-js/client";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import invariant from "tiny-invariant";
import { useAccount } from "wagmi";

import { useEthersSigner } from "@/wagmi.config";

// biome-ignore lint/style/noNonNullAssertion: because it's initialized in the provider.
export const idOSConsumerContext = createContext<ConsumerConfig>(null!);
export const useIdOSConsumer = () => useContext(idOSConsumerContext);

export function IDOSConsumerProvider({ children }: PropsWithChildren) {
  const [config, setConfig] = useState<ConsumerConfig | null>(null);
  const [initializing, setInitializing] = useState(true);
  const initialized = useRef(false);

  const { address } = useAccount();
  const signer = useEthersSigner();
  const [hasProfile, setHasProfile] = useState(false);

  const initialize = useCallback(async () => {
    if (initialized.current) return;

    if (!signer) return;

    initialized.current = true;

    const _config = await createConsumerConfig({
      nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL ?? "",
      signer,
      enclaveOptions: {
        container: "#idOS-enclave",
      },
    });

    const _hasProfile = await checkUserProfile(_config, address as string);

    if (_hasProfile && signer) {
      setHasProfile(true);
    }

    setConfig(_config);

    setInitializing(false);
  }, [address, signer]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (initializing) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 px-6">
        <CircularProgress aria-label="initializing idOS..." />
        <p>initializing idOS...</p>
      </div>
    );
  }

  if (!hasProfile || !config) {
    const issuerUrl = process.env.NEXT_PUBLIC_ISSUER_URL;
    invariant(issuerUrl, "NEXT_PUBLIC_ISSUER_URL is not set");

    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4">
        <h1 className="font-semibold text-2xl">No idOS profile found for this address 😔</h1>
        <p>Click the button below to create one:</p>
        <Button as={Link} href={issuerUrl} className="fit-content" target="_blank" rel="noreferrer">
          Create an idOS profile
        </Button>
      </div>
    );
  }

  return <idOSConsumerContext.Provider value={config}>{children}</idOSConsumerContext.Provider>;
}
