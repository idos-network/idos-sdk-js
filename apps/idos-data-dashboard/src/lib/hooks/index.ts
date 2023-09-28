import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useEffect, useState } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";

/**
 * @deprecated
 * This will be removed in future versions.
 * Use `useAtom(signerAtom)` or `useAtomValue(signerAtom)` instead.
 *
 */
export function useSigner() {
  const [signer, setSigner] = useState<JsonRpcSigner>();

  useEffect(() => {
    const getSigner = async () => {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setSigner(signer);
    };
    getSigner();
  }, []);

  return signer;
}

export type StoredCredentials = {
  password: string;
  expiresAt?: string;
  publicKey: string;
  secretKey: string;
};

export const IDOS_KEYS = "IDOS_KEYS";

export function useStoredCredentials(): StoredCredentials | null {
  const [sessionValue] = useSessionStorage(IDOS_KEYS, "");
  const [storageValue] = useLocalStorage(IDOS_KEYS, "");

  if (sessionValue) {
    return JSON.parse(sessionValue);
  }

  if (storageValue) {
    return JSON.parse(storageValue);
  }

  return null;
}
