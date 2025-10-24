import { mnemonicToSeedSync } from "bip39";
import tweetnacl from "tweetnacl";

export async function mnemonicToSeed(mnemonic: string) {
  return mnemonicToSeedSync(mnemonic);
}

export async function createKeyPairFromSeed(seed: Uint8Array) {
  const signKeyPair = tweetnacl.sign.keyPair.fromSeed(seed.slice(0, 32));

  const seed32 = signKeyPair.secretKey.slice(0, 32);

  const PKCS8_ED25519_PREFIX = new Uint8Array([
    0x30,
    0x2e, // SEQUENCE, len 46
    0x02,
    0x01,
    0x00, // INTEGER 0
    0x30,
    0x05, // SEQUENCE len 5
    0x06,
    0x03,
    0x2b,
    0x65,
    0x70, // OID 1.3.101.112 (Ed25519)
    0x04,
    0x22, // OCTET STRING len 34
    0x04,
    0x20, // OCTET STRING len 32 (priv key)
  ]);

  function concat(a: Uint8Array, b: Uint8Array) {
    const c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
  }

  const pkcs8 = concat(PKCS8_ED25519_PREFIX, seed32);

  const keyPair = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8.buffer,
    { name: "Ed25519", namedCurve: "curve25519" },
    true,
    ["sign"],
  );

  if (!keyPair) {
    throw new Error("Failed to import Ed25519 key from seed");
  }

  return {
    keyPair,
    publicKey: signKeyPair.publicKey,
  };
}

const DB_NAME = "keysDB";
const DB_STORE_NAME = "keys";
const DB_KEY = "keyPair";

async function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);

    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      db.deleteObjectStore(DB_STORE_NAME);
      db.createObjectStore(DB_STORE_NAME, { keyPath: "name" });
    };
    req.onsuccess = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    req.onerror = () => reject(req.error);
    req.onblocked = () => console.warn("openDB: blocked");
  });
}

export async function storeKey(keyPair: CryptoKey, publicKey: Uint8Array) {
  const db = await openDatabase();
  const tx = db.transaction(DB_STORE_NAME, "readwrite");
  const store = tx.objectStore(DB_STORE_NAME);
  store.put({ name: DB_KEY, keyPair, publicKey });
  await tx.commit();
}

export async function isKeyAvailable() {
  try {
    const keys = await getKeys();
    return keys !== null;
  } catch {
    return false;
  }
}

export async function getKeys(): Promise<{ keyPair: CryptoKey; publicKey: Uint8Array }> {
  const db = await openDatabase();
  const tx = db.transaction(DB_STORE_NAME, "readonly");
  const store = tx.objectStore(DB_STORE_NAME);

  return await new Promise((resolve, reject) => {
    const req = store.get(DB_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
