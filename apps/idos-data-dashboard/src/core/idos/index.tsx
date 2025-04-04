"use client";

// export type idOSContextValue = {
//   sdk: idOS;
//   address: string | undefined; // userAddress
//   hasProfile: boolean;
//   publicKey: string | undefined; // currentUserPublicKey
//   reset: () => Promise<void>; // logOut
// };

import { type idOSClient, idOSClientConfiguration } from "@idos-network/core";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { ConnectWallet } from "@/connect-wallet";
import { useWalletSelector } from "@/core/near";
import { useEthersSigner } from "@/core/wagmi";
import type { Wallet } from "@near-wallet-selector/core";
import type { SignMessageMethod } from "@near-wallet-selector/core/src/lib/wallet";
import type { JsonRpcSigner } from "ethers";

const config = new idOSClientConfiguration({
  nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
  enclaveOptions: {
    container: "#idOS-enclave",
    url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
  },
});

export const idOSClientContext = createContext<idOSClient>(config);
export const useIdosClient = () => useContext(idOSClientContext);

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

export function IdosClientProvider({ children }: PropsWithChildren) {
  const [idOSClient, setIdosClient] = useState<idOSClient>(config);
  const signer = useSigner();

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
    return <ConnectWallet />;
  }

  // TODO(pkoch): how do I know when I'm loading?

  return <idOSClientContext.Provider value={idOSClient}>{children}</idOSClientContext.Provider>;
}

function assertNever(state: never) {
  throw new Error(`Unexpected state: ${JSON.stringify(state)}`);
}
