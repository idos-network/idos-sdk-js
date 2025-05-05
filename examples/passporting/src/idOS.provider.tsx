"use client";

import { CircularProgress } from "@heroui/react";
import { type idOSClient, idOSClientConfiguration } from "@idos-network/core";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useEthersSigner } from "@/wagmi.config";

const startingConfig = new idOSClientConfiguration({
  nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL ?? "",
  enclaveOptions: {
    container: "#idOS-enclave",
    url: process.env.NEXT_PUBLIC_IDOS_ENCLAVE_URL ?? "",
  },
});

export const idOSClientContext = createContext<idOSClient>(startingConfig);
export const useIdosClient = () => useContext(idOSClientContext);

export function IdosClientProvider({ children }: PropsWithChildren) {
  const [idOSClient, setIdosClient] = useState<idOSClient>(startingConfig);
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
      <div className="flex h-dvh flex-col items-center justify-center gap-2 px-6">
        <CircularProgress aria-label="initializing idOS..." />
        <p>initializing idOS...</p>
      </div>
    );
  }

  return <idOSClientContext.Provider value={idOSClient}>{children}</idOSClientContext.Provider>;
}

function assertNever(state: never) {
  throw new Error(`Unexpected state: ${JSON.stringify(state)}`);
}
