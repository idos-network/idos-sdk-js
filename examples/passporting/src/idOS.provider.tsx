"use client";

import { Button, CircularProgress, Link } from "@heroui/react";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import invariant from "tiny-invariant";

import { useEthersSigner } from "@/wagmi.config";
import { type idOSClient, idOSClientConfiguration } from "@idos-network/core";

const startingConfig = new idOSClientConfiguration({
  nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL ?? "",
  enclaveOptions: { container: "#idOS-enclave" },
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

  if (idOSClient.state === "with-user-signer") {
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

  return <idOSClientContext.Provider value={idOSClient}>{children}</idOSClientContext.Provider>;
}

function assertNever(state: never) {
  throw new Error(`Unexpected state: ${JSON.stringify(state)}`);
}
