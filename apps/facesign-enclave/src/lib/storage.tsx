import { createContext, useContext, useEffect, useState } from "react";

// Simple wrapper later will be updated by encryption etc..
export const storage = {
  set: (key: string, value: string) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get: (key: string) => {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
  },
};

async function registerPasskey() {
  const publicKey = {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp: { name: "My App" },
    user: {
      id: crypto.getRandomValues(new Uint8Array(16)),
      name: "user@example.com",
      displayName: "Example User"
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
    authenticatorSelection: { userVerification: "required" }
  };

  const cred = await navigator.credentials.create({ publicKey });

  // Save the credential ID so we can reference it later
  const credentialId = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
  localStorage.setItem("credentialId", credentialId);

  console.log("Passkey registered:", credentialId);
}

async function deriveEncryptionKeyFromPasskey() {
  const storedCredentialId = localStorage.getItem("credentialId");
  if (!storedCredentialId) throw new Error("No stored credentialId — call registerPasskey() first");

  // Convert back to ArrayBuffer
  const rawId = Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0));

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const cred = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ id: rawId.buffer, type: "public-key" }],
      userVerification: "required"
    }
  });

  // Derive a symmetric key from the signature
  const signature = new Uint8Array(cred.response.signature);
  const salt = new TextEncoder().encode("my-app-storage-key");

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    signature,
    "HKDF",
    false,
    ["deriveKey"]
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      salt,
      info: new Uint8Array([]),
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return aesKey;
}


export interface StorageContextType {
  entropy: string | null;
  setEntropy: (entropy: string) => void;
}

export const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function useStorageContext() {
  const context = useContext(StorageContext);

  if (!context) {
    throw new Error("useStorageContext must be used within a StorageContextProvider");
  }

  return context;
}

export function StorageContextProvider({ children }: { children: React.ReactNode }) {
  const [entropy, setEntropy] = useState<string | null>(storage.get("entropy"));

  const contextValue = {
    entropy: entropy,
    setEntropy: (entropy: string) => {
      storage.set("entropy", entropy);
      setEntropy(entropy);
    },
  }

  useEffect(() => {
    // Check if user already has a passkey registered
  }, []);

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
}
