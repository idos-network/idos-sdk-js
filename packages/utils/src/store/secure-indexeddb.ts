/**
 * Secure IndexedDB store that uses WebCrypto for non-extractable key storage
 * This extends the regular IndexedDB store with secure key management
 */

import type nacl from "tweetnacl";
import { IndexedDBStore } from "./indexeddb";
import type { PipeCodecArgs, Store } from "./interface";
import { createSecureKeyManager, type SecureKeyManager } from "./secure-key-manager";

export class SecureIndexedDBStore extends IndexedDBStore {
  private keyManager: SecureKeyManager;

  constructor(
    dbName = "idOS-Store",
    version = 1,
    storeName = "keyValueStore",
    keyPrefix = "idOS-",
  ) {
    super(dbName, version, storeName, keyPrefix);
    this.keyManager = createSecureKeyManager();
  }

  /**
   * Store a NaCl key pair securely using WebCrypto
   */
  async setSecureKeyPair(keyId: string, keyPair: nacl.BoxKeyPair): Promise<void> {
    await this.keyManager.storeKeyPair(keyId, keyPair);
  }

  /**
   * Retrieve a NaCl key pair securely
   */
  async getSecureKeyPair(keyId: string): Promise<nacl.BoxKeyPair | null> {
    return await this.keyManager.getKeyPair(keyId);
  }

  /**
   * Check if a secure key pair exists
   */
  async hasSecureKeyPair(keyId: string): Promise<boolean> {
    const keyPair = await this.keyManager.getKeyPair(keyId);
    return keyPair !== null;
  }

  /**
   * Delete a secure key pair
   */
  async deleteSecureKeyPair(keyId: string): Promise<void> {
    await this.keyManager.deleteKeyPair(keyId);
  }

  /**
   * Override the regular set method to intercept binary key data
   */
  // biome-ignore lint/suspicious/noExplicitAny: any is fine here for store interface compatibility
  async set<K = any>(key: string, value: K): Promise<void> {
    // Check if this looks like a secret key that should be stored securely
    if (this.isSecretKeyData(key, value)) {
      console.warn(
        `Attempting to store secret key "${key}" as plain data. Use setSecureKeyPair() instead.`,
      );
      // For backward compatibility, we'll still store it but warn
    }

    return super.set(key, value);
  }

  /**
   * Check if the data being stored looks like secret key material
   */
  // biome-ignore lint/suspicious/noExplicitAny: any is fine here for checking data types
  private isSecretKeyData(key: string, value: any): boolean {
    // Check for common secret key indicators
    const secretKeyIndicators = [
      "secret-key",
      "private-key",
      "encryption-secret",
      "signing-secret",
    ];

    const keyLower = key.toLowerCase();
    const hasSecretIndicator = secretKeyIndicators.some((indicator) =>
      keyLower.includes(indicator),
    );

    // Check if value looks like binary key data (Uint8Array-like)
    const isBinaryData =
      value instanceof Uint8Array ||
      (Array.isArray(value) && value.length === 32) ||
      (typeof value === "string" && value.length > 20); // Base64 encoded key

    return hasSecretIndicator && isBinaryData;
  }

  /**
   * Create a codec-aware version that handles secure keys
   */
  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>): SecureIndexedDBStore {
    const codedStore = Object.create(this);

    // Override get and set methods with codec
    codedStore.get = async (key: string) => {
      const result = await this.get(key);
      if (result) return decode(result);
      return undefined;
    };

    // biome-ignore lint/suspicious/noExplicitAny: any is fine here for codec compatibility
    codedStore.set = async (key: string, value: any) => {
      // For codec operations, check if this is secret key material
      if (this.isSecretKeyData(key, value) && value instanceof Uint8Array) {
        console.warn(
          `Secret key "${key}" should be stored using setSecureKeyPair() for better security.`,
        );
        // For backward compatibility during transition
      }

      await this.set(key, encode(value));
    };

    // Add secure key methods to the coded store
    codedStore.setSecureKeyPair = this.setSecureKeyPair.bind(this);
    codedStore.getSecureKeyPair = this.getSecureKeyPair.bind(this);
    codedStore.hasSecureKeyPair = this.hasSecureKeyPair.bind(this);
    codedStore.deleteSecureKeyPair = this.deleteSecureKeyPair.bind(this);

    return codedStore;
  }

  /**
   * Override reset to also clear secure keys
   */
  async reset(): Promise<void> {
    await super.reset();
    await this.keyManager.clear();
  }

  /**
   * Get key manager for advanced operations
   */
  getKeyManager(): SecureKeyManager {
    return this.keyManager;
  }
}

/**
 * Create a secure store with automatic fallback
 */
export function createSecureStore(keyPrefix = "idOS-"): Store {
  try {
    // Check if we can use secure storage
    if (
      typeof crypto !== "undefined" &&
      crypto.subtle &&
      // @ts-ignore
      typeof indexedDB !== "undefined"
    ) {
      return new SecureIndexedDBStore("idOS-Store", 1, "keyValueStore", keyPrefix);
    }
  } catch (error) {
    console.warn("Secure storage not available, falling back to regular IndexedDB:", error);
  }

  // Fallback to regular IndexedDB store
  return new IndexedDBStore("idOS-Store", 1, "keyValueStore", keyPrefix);
}
