"use clent";

import { Button, CircularProgress, Link } from "@heroui/react";
import { idOS } from "@idos-network/idos-sdk";
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

// biome-ignore lint/style/noNonNullAssertion: because it's initialised in the provider.
export const idOSContext = createContext<idOS>(null!);
export const useIdOS = () => useContext(idOSContext);

export function IDOSProvider({ children }: PropsWithChildren) {
  const [sdk, setSdk] = useState<idOS | null>(null);
  const [initializing, setInitializing] = useState(true);
  const initialised = useRef(false);
  const { address } = useAccount();
  const signer = useEthersSigner();
  const [hasProfile, setHasProfile] = useState(false);

  const initialise = useCallback(async () => {
    if (initialised.current) return;

    if (!signer) return;

    initialised.current = true;

    const _instance = await idOS.init({
      nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL,
      enclaveOptions: {
        container: "#idOS-enclave",
      },
    });

    const _hasProfile = await _instance.hasProfile(address as string);

    if (_hasProfile && signer) {
      // @ts-ignore
      await _instance.setSigner("EVM", signer);
      setSdk(_instance);
      setHasProfile(true);
    }
    setInitializing(false);
  }, [address, signer]);

  useEffect(() => {
    initialise();
  }, [initialise]);

  if (initializing) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 px-6">
        <CircularProgress aria-label="Initialising idOS..." />
        <p>Initialising idOS...</p>
      </div>
    );
  }

  if (!hasProfile || !sdk) {
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

  return <idOSContext.Provider value={sdk}>{children}</idOSContext.Provider>;
}
