"use clent";

import { CircularProgress } from "@heroui/react";
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
import { useAccount } from "wagmi";

import { useEthersSigner } from "@/wagmi.config";
import { WalletConnector } from "./components/wallet-connector";

// biome-ignore lint/style/noNonNullAssertion: because it's initialised in the provider.
export const idOSContext = createContext<idOS>(null!);
export const useIdOS = () => useContext(idOSContext);

export function IDOSProvider({ children }: PropsWithChildren) {
  const [sdk, setSdk] = useState<idOS | null>(null);
  const [initializing, setInitializing] = useState(true);
  const initialised = useRef(false);
  const { address } = useAccount();
  const signer = useEthersSigner();

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

  if (!sdk) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 px-6">
        <p>
          No idOS profile found for this address. please create one{" "}
          <a
            href="https://issuer-sdk-demo.vercel.app/"
            className="text-blue-200"
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>
        </p>
      </div>
    );
  }
  return <idOSContext.Provider value={sdk}>{children}</idOSContext.Provider>;
}
