import { utf8Encode } from "@idos-network/utils/codecs";
import { mnemonicToKeyPair } from "@idos-network/utils/facesign";
import { storeGet, storeSet } from "./storage";

export const DB_KEY_KEK = "idOS:facesign:kek";
export const DB_KEY_MNEMONIC = "idOS:facesign:mnemonic";

export async function storeMnemonic(mnemonic: string) {
  await encryptAndStore(DB_KEY_MNEMONIC, utf8Encode(mnemonic));
}

export async function getKeyPair() {
  const mnemonicBytes = await retrieveAndDecrypt(DB_KEY_MNEMONIC);

  if (!mnemonicBytes) {
    throw new Error("No mnemonic stored");
  }

  return mnemonicToKeyPair(mnemonicBytes);
}
export async function checkKeyAvailability(): Promise<boolean> {
  try {
    await getKeyPair();
    return true;
  } catch (e) {
    console.log("Key availability check failed:", e);
    return false;
  }
}

async function ensureKek() {
  let key = await storeGet<CryptoKey>(DB_KEY_KEK);

  if (!key) {
    key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false, // not extractable
      ["encrypt", "decrypt"],
    );

    await storeSet(DB_KEY_KEK, key);
  }

  return key;
}

async function encryptAndStore(key: string, data: Uint8Array) {
  const iv = crypto.getRandomValues(new Uint8Array(96));
  const kek = await ensureKek();

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, kek, data as any);

  const ciphertext = encrypted.slice(0, encrypted.byteLength - 16);
  const authTag = encrypted.slice(encrypted.byteLength - 16);

  await storeSet(key, {
    ciphertext: new Uint8Array(ciphertext),
    iv,
    authTag: new Uint8Array(authTag),
  });
}

async function retrieveAndDecrypt(key: string): Promise<Uint8Array | null> {
  const record = await storeGet<{
    ciphertext: Uint8Array;
    iv: Uint8Array;
    authTag: Uint8Array;
  }>(key);

  if (!record) {
    return null;
  }

  const { ciphertext, iv, authTag } = record;
  const kek = await ensureKek();

  const encryptedData = new Uint8Array(ciphertext.length + authTag.length);
  encryptedData.set(ciphertext, 0);
  encryptedData.set(authTag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as any },
    kek,
    encryptedData,
  );

  return new Uint8Array(decrypted);
}
