import { createContext, useContext, useEffect, useState } from "react";
import nacl from "tweetnacl";
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

export function useKeyStorageContext() {
  const context = useContext(KeyStorageContext);

  if (!context) {
    throw new Error("useKeyStorageContext must be used within a KeyStorageContextProvider");
  }

  return context;
}

export function KeyStorageContextProvider({ children }: { children: React.ReactNode }) {
  const [isKeyAvailable, setIsKeyAvailable] = useState<boolean | null>(null);

  const contextValue = {
    isKeyAvailable: isKeyAvailable || false,
    setMnemonic: async (mnemonic: string) => {
      await storeMnemonic(mnemonic);
      setIsKeyAvailable(true);
    },
    getPublicKey: async () => {
      const { publicKey } = await getKeyPair();
      return Buffer.from(publicKey).toString("hex");
    },
    sign: async (data: Uint8Array) => {
      const keyPair = await getKeyPair();

      return nacl.sign.detached(data, keyPair.secretKey);
    },
  };

  useEffect(() => {
    // Check if user already has a passkey registered
    checkKeyAvailability().then((available) => {
      console.log("Key availability:", available);
      setIsKeyAvailable(available);
    });
  }, []);

  if (isKeyAvailable === null) {
    return <div>Loading...</div>;
  }

  return <KeyStorageContext.Provider value={contextValue}>{children}</KeyStorageContext.Provider>;
}
