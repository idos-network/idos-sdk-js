import { mnemonicToSeed } from "bip39";
import { createContext, useContext, useEffect, useState } from "react";
import {
  isKeyAvailable as checkKeyAvailability,
  createKeyPairFromSeed,
  getKeys,
  storeKey,
} from "@/lib/keys";

export interface KeyStorage {
  isKeyAvailable: boolean;
  setMnemonic: (mnemonic: string) => void;
  sign: (data: string) => Promise<string>;
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
      const seed = await mnemonicToSeed(mnemonic);
      const keys = await createKeyPairFromSeed(seed);
      await storeKey(keys.keyPair, keys.publicKey);
      setIsKeyAvailable(true);
    },
    getPublicKey: async () => {
      const { publicKey } = await getKeys();
      return Buffer.from(publicKey).toString("hex");
    },
    sign: async (data: string) => {
      const { keyPair } = await getKeys();

      return crypto.subtle
        .sign("Ed25519", keyPair, new TextEncoder().encode(data))
        .then((signature) => {
          return Buffer.from(signature).toString("hex");
        });
    },
  };

  useEffect(() => {
    // Check if user already has a passkey registered
    checkKeyAvailability().then((available) => {
      setIsKeyAvailable(available);
    });
  }, []);

  if (isKeyAvailable === null) {
    return <div>Loading...</div>;
  }

  return <KeyStorageContext.Provider value={contextValue}>{children}</KeyStorageContext.Provider>;
}
