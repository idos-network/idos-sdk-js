import { mnemonicToSeedSync } from "bip39";

export async function mnemonicToSeed(mnemonic: string) {
  return mnemonicToSeedSync(mnemonic);
}

function concat(a: Uint8Array, b: Uint8Array) {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

// PKCS#8 prefix pro Ed25519 privateKey (for 32B seed)
const PKCS8_ED25519_PREFIX = new Uint8Array([
  0x30,
  0x2e, // SEQUENCE, len 46 (0x2e)
  0x02,
  0x01,
  0x00, // INTEGER 0
  0x30,
  0x05, // SEQUENCE len 5
  0x06,
  0x03,
  0x2b,
  0x65,
  0x70, // OID 1.3.101.112 (ed25519)
  0x04,
  0x22, // OCTET STRING len 34
  0x04,
  0x20, // OCTET STRING len 32 (to je private key)
]);

export async function createKeyPairFromSeed(seed: Uint8Array) {
  // WebCrypto Ed25519 keys are 32-byte seeds
  const pkcs8 = concat(PKCS8_ED25519_PREFIX, seed.slice(0, 32));

  const keyPair = await crypto.subtle.importKey("pkcs8", pkcs8.buffer, { name: "Ed25519" }, false, [
    "sign",
  ]);

  if (!keyPair) {
    throw new Error("Failed to import Ed25519 key from seed");
  }

  return keyPair;
}

const DB_NAME = "keysDB";
const DB_STORE_NAME = "keys";
const DB_KEY_NAME = "userKeyPair";

async function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);

    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME, { keyPath: "name" });
      }
    };
    req.onsuccess = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    req.onerror = () => reject(req.error);
    req.onblocked = () => console.warn("openDB: blocked");
  });
}

export async function storeKey(keyPair: CryptoKey) {
  const db = await openDatabase();
  const tx = db.transaction(DB_STORE_NAME, "readwrite");
  const store = tx.objectStore(DB_STORE_NAME);
  store.put({ name: DB_KEY_NAME, keyPair });
  await tx.commit();
}

export async function isKeyAvailable() {
  try {
    const key = await getKey();
    return key !== null;
  } catch {
    return false;
  }
}

export async function getKey(): Promise<CryptoKey> {
  const db = await openDatabase();
  const tx = db.transaction(DB_STORE_NAME, "readonly");
  const store = tx.objectStore(DB_STORE_NAME);

  return await new Promise((resolve, reject) => {
    const req = store.get(DB_KEY_NAME);
    req.onsuccess = () => resolve(req.result?.keyPair || null);
    req.onerror = () => reject(req.error);
  });
}
