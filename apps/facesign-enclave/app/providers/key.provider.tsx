import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import nacl from "tweetnacl";
import { Spinner } from "@/components/ui/spinner";
import { checkKeyAvailability, getKeyPair, storeMnemonic } from "@/lib/keys";

export interface KeyStorage {
  isKeyAvailable: boolean;
  setMnemonic: (mnemonic: string) => void;
  sign: (data: Uint8Array) => Promise<Uint8Array>;
  getPublicKey: () => Promise<string>;
}

export const KeyStorageContext = createContext<KeyStorage>({
  isKeyAvailable: false,
  setMnemonic: () => {
    throw new Error("KeyStorageContext not initialized");
  },
  sign: async () => {
    throw new Error("KeyStorageContext not initialized");
  },
  getPublicKey: async () => {
    throw new Error("KeyStorageContext not initialized");
  },
});

export function KeyStorageContextProvider({ children }: { children: React.ReactNode }) {
  const [isKeyAvailable, setIsKeyAvailable] = useState<boolean | null>(null);

  const setMnemonic = useCallback(async (mnemonic: string) => {
    await storeMnemonic(mnemonic);
    setIsKeyAvailable(true);
  }, []);

  const getPublicKey = useCallback(async () => {
    const { publicKey } = await getKeyPair();
    // Convert the public key bytes to a hex string.
    // Similar to return Buffer.from(publicKey).toString("hex");
    return Array.from(publicKey, (b) => b.toString(16).padStart(2, "0")).join("");
  }, []);

  const sign = useCallback(async (data: Uint8Array) => {
    const keyPair = await getKeyPair();
    return nacl.sign.detached(data, keyPair.secretKey);
  }, []);

  const contextValue = useMemo(
    () => ({
      isKeyAvailable: isKeyAvailable || false,
      setMnemonic,
      getPublicKey,
      sign,
    }),
    [isKeyAvailable, setMnemonic, getPublicKey, sign],
  );

  useEffect(() => {
    // Check if user already has a passkey registered
    checkKeyAvailability().then((available) => {
      console.log("Key availability:", available);
      setIsKeyAvailable(available);
    });
  }, []);

  if (isKeyAvailable === null) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <KeyStorageContext value={contextValue}>{children}</KeyStorageContext>;
}

export function useKeyStorageContext() {
  const context = use(KeyStorageContext);

  if (!context) {
    throw new Error("`useKeyStorageContext` must be used within a KeyStorageContextProvider");
  }

  return context;
}
