// Connector sessions are stored for this origin, so every popup document shares them.
// Wipe known keys before wallet SDKs read storage, and again when the document is discarded.

const CONNECTOR_STORAGE_PREFIXES = [
  "@appkit",
  "wagmi",
  "wc@",
  "walletconnect",
  "@walletconnect",
  "near-wallet-selector",
  "near-api-js",
  "_meteor_wallet",
];

export type KeyValueStorage = {
  length: number;
  key(index: number): string | null;
  removeItem(key: string): void;
};

export function isConnectorStorageKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return CONNECTOR_STORAGE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function clearConnectorPersistence(storage: KeyValueStorage): void {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && isConnectorStorageKey(key)) keys.push(key);
  }
  for (const key of keys) storage.removeItem(key);
}

export function installConnectorPersistenceReset(): void {
  clearConnectorPersistence(localStorage);
  window.addEventListener("pagehide", () => {
    clearConnectorPersistence(localStorage);
  });
}

if (typeof window !== "undefined") {
  installConnectorPersistenceReset();
}
