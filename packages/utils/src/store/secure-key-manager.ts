/**
 * Secure Key Manager using WebCrypto API for non-extractable key storage
 * This provides better security by ensuring private keys cannot be easily extracted
 */

// ignore whole ts warning for this file
// @ts-nocheck => there's alot of usage of

import type nacl from "tweetnacl";

export interface SecureKeyManager {
  /**
   * Store a NaCl key pair securely using WebCrypto master key
   */
  storeKeyPair(keyId: string, keyPair: nacl.BoxKeyPair): Promise<void>;

  /**
   * Retrieve and decrypt a NaCl key pair using WebCrypto master key
   */
  getKeyPair(keyId: string): Promise<nacl.BoxKeyPair | null>;

  /**
   * Check if a key pair exists
   */
  hasKeyPair(keyId: string): Promise<boolean>;

  /**
   * Delete a stored key pair
   */
  deleteKeyPair(keyId: string): Promise<void>;

  /**
   * Clear all stored keys
   */
  clear(): Promise<void>;
}

/**
 * WebCrypto-based secure key manager that uses non-extractable keys
 */
export class WebCryptoKeyManager implements SecureKeyManager {
  // biome-ignore lint/suspicious/noExplicitAny: CryptoKey type not available in all environments
  private masterKey: any = null;
  private readonly MASTER_KEY_NAME = "idOS-master-key";
  private readonly KEY_STORE_PREFIX = "idOS-encrypted-key-";
  private readonly DB_NAME = "idOS-SecureKeys-v2";
  private readonly DB_VERSION = 1;

  /**
   * Helper method to open IndexedDB with proper schema setup
   */
  // biome-ignore lint/suspicious/noExplicitAny: IndexedDB types not available in all environments
  private async openDatabase(): Promise<any> {
    return new Promise((resolve, reject) => {
      // biome-ignore lint/suspicious/noExplicitAny: Need to access global IndexedDB
      const idb = (globalThis as any).indexedDB;
      if (!idb) {
        reject(new Error("IndexedDB not available"));
        return;
      }

      const request = idb.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = (event) => {
        console.error("❌ Failed to open key database", event);
        reject(new Error(`Failed to open key database: ${event}`));
      };

      request.onblocked = (event) => {
        console.warn("⚠️ Database blocked by another connection", event);
        // Try to proceed anyway
      };

      // biome-ignore lint/suspicious/noExplicitAny: IndexedDB event types not available
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        try {
          // Create object stores for fresh database
          db.createObjectStore("masterKeys");
          db.createObjectStore("encryptedKeys");
        } catch (error) {
          console.error("❌ Error creating object stores:", error);
          reject(new Error(`Failed to create object stores: ${error}`));
          return;
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        // Verify both object stores exist
        const hasMasters = db.objectStoreNames.contains("masterKeys");
        const hasEncrypted = db.objectStoreNames.contains("encryptedKeys");

        if (!hasMasters || !hasEncrypted) {
          console.error("❌ Required object stores missing after database open");
          db.close();
          reject(new Error("Required object stores not found"));
          return;
        }

        resolve(db);
      };
    });
  }

  /**
   * Initialize or retrieve the master key from IndexedDB
   */
  // biome-ignore lint/suspicious/noExplicitAny: CryptoKey type not available in all environments
  private async getMasterKey(): Promise<any> {
    if (this.masterKey) {
      return this.masterKey;
    }

    try {
      // Try to get existing master key from IndexedDB
      const storedKey = await this.getStoredMasterKey();
      if (storedKey) {
        this.masterKey = storedKey;
        return this.masterKey;
      }
    } catch (error) {
      console.warn("Could not retrieve existing master key:", error);
    }

    // Generate new master key
    this.masterKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      false, // non-extractable!
      ["encrypt", "decrypt"],
    );

    // Store the master key in IndexedDB
    await this.storeMasterKey(this.masterKey);

    return this.masterKey;
  }

  /**
   * Store master key in IndexedDB
   */
  // biome-ignore lint/suspicious/noExplicitAny: CryptoKey type not available in all environments
  private async storeMasterKey(key: any): Promise<void> {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["masterKeys"], "readwrite");
        const store = transaction.objectStore("masterKeys");

        const putRequest = store.put(key, this.MASTER_KEY_NAME);

        putRequest.onsuccess = () => {
          db.close();
          resolve();
        };

        putRequest.onerror = () => {
          db.close();
          reject(new Error("Failed to store master key"));
        };
      });
    } catch (error) {
      throw new Error(`Failed to store master key: ${error}`);
    }
  }

  /**
   * Retrieve master key from IndexedDB
   */
  // biome-ignore lint/suspicious/noExplicitAny: CryptoKey type not available in all environments
  private async getStoredMasterKey(): Promise<any> {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains("masterKeys")) {
          db.close();
          resolve(null);
          return;
        }

        const transaction = db.transaction(["masterKeys"], "readonly");
        const store = transaction.objectStore("masterKeys");

        const getRequest = store.get(this.MASTER_KEY_NAME);

        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result || null);
        };

        getRequest.onerror = () => {
          db.close();
          reject(new Error("Failed to retrieve master key"));
        };
      });
    } catch (error) {
      console.warn("Failed to get stored master key:", error);
      return null;
    }
  }

  /**
   * Encrypt data using the master key
   */
  private async encryptData(data: Uint8Array): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const masterKey = await this.getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      masterKey,
      data,
    );

    return { encrypted, iv };
  }

  /**
   * Decrypt data using the master key
   */
  private async decryptData(encrypted: ArrayBuffer, iv: Uint8Array): Promise<Uint8Array> {
    const masterKey = await this.getMasterKey();

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      masterKey,
      encrypted,
    );

    return new Uint8Array(decrypted);
  }

  /**
   * Store encrypted key data in IndexedDB
   */
  private async storeEncryptedData(
    keyId: string,
    encrypted: ArrayBuffer,
    iv: Uint8Array,
  ): Promise<void> {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["encryptedKeys"], "readwrite");
        const store = transaction.objectStore("encryptedKeys");

        const putRequest = store.put({ encrypted, iv }, this.KEY_STORE_PREFIX + keyId);

        putRequest.onsuccess = () => {
          db.close();
          resolve();
        };

        putRequest.onerror = () => {
          db.close();
          reject(new Error("Failed to store encrypted key"));
        };
      });
    } catch (error) {
      throw new Error(`Failed to store encrypted data: ${error}`);
    }
  }

  /**
   * Retrieve encrypted key data from IndexedDB
   */
  private async getEncryptedData(
    keyId: string,
  ): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array } | null> {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains("encryptedKeys")) {
          db.close();
          resolve(null);
          return;
        }

        const transaction = db.transaction(["encryptedKeys"], "readonly");
        const store = transaction.objectStore("encryptedKeys");

        const getRequest = store.get(this.KEY_STORE_PREFIX + keyId);

        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result || null);
        };

        getRequest.onerror = () => {
          db.close();
          reject(new Error("Failed to retrieve encrypted key"));
        };
      });
    } catch (error) {
      console.warn("Failed to get encrypted data:", error);
      return null;
    }
  }

  /**
   * Store a NaCl key pair securely
   */
  async storeKeyPair(keyId: string, keyPair: nacl.BoxKeyPair): Promise<void> {
    // Serialize the key pair
    const serialized = JSON.stringify({
      publicKey: Array.from(keyPair.publicKey),
      secretKey: Array.from(keyPair.secretKey),
    });

    const data = new TextEncoder().encode(serialized);

    // Encrypt using WebCrypto master key
    const { encrypted, iv } = await this.encryptData(data);

    // Store encrypted data
    await this.storeEncryptedData(keyId, encrypted, iv);
  }

  /**
   * Retrieve a NaCl key pair securely
   */
  async getKeyPair(keyId: string): Promise<nacl.BoxKeyPair | null> {
    try {
      // Get encrypted data
      const encryptedData = await this.getEncryptedData(keyId);
      if (!encryptedData) {
        return null;
      }

      // Decrypt using WebCrypto master key
      const decrypted = await this.decryptData(encryptedData.encrypted, encryptedData.iv);

      // Deserialize key pair
      const serialized = new TextDecoder().decode(decrypted);
      const keyData = JSON.parse(serialized);

      return {
        publicKey: new Uint8Array(keyData.publicKey),
        secretKey: new Uint8Array(keyData.secretKey),
      };
    } catch (error) {
      console.error("Failed to retrieve key pair:", error);
      return null;
    }
  }

  /**
   * Check if a key pair exists
   */
  async hasKeyPair(keyId: string): Promise<boolean> {
    const data = await this.getEncryptedData(keyId);
    return data !== null;
  }

  /**
   * Delete a stored key pair
   */
  async deleteKeyPair(keyId: string): Promise<void> {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains("encryptedKeys")) {
          db.close();
          resolve();
          return;
        }

        const transaction = db.transaction(["encryptedKeys"], "readwrite");
        const store = transaction.objectStore("encryptedKeys");

        const deleteRequest = store.delete(this.KEY_STORE_PREFIX + keyId);

        deleteRequest.onsuccess = () => {
          db.close();
          resolve();
        };

        deleteRequest.onerror = () => {
          db.close();
          reject(new Error("Failed to delete key"));
        };
      });
    } catch (error) {
      console.warn("Failed to delete key pair:", error);
    }
  }

  /**
   * Clear all stored keys
   */
  async clear(): Promise<void> {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains("encryptedKeys")) {
          db.close();
          resolve();
          return;
        }

        const transaction = db.transaction(["encryptedKeys"], "readwrite");
        const store = transaction.objectStore("encryptedKeys");

        const clearRequest = store.clear();

        clearRequest.onsuccess = () => {
          db.close();
          resolve();
        };

        clearRequest.onerror = () => {
          db.close();
          reject(new Error("Failed to clear keys"));
        };
      });
    } catch (error) {
      console.warn("Failed to clear keys:", error);
    }
  }
}

/**
 * Fallback key manager for environments without WebCrypto support
 */
export class FallbackKeyManager implements SecureKeyManager {
  private keys: Map<string, nacl.BoxKeyPair> = new Map();

  async storeKeyPair(keyId: string, keyPair: nacl.BoxKeyPair): Promise<void> {
    // Store in memory only - not persistent but at least not in localStorage
    this.keys.set(keyId, keyPair);
  }

  async getKeyPair(keyId: string): Promise<nacl.BoxKeyPair | null> {
    return this.keys.get(keyId) || null;
  }

  async hasKeyPair(keyId: string): Promise<boolean> {
    return this.keys.has(keyId);
  }

  async deleteKeyPair(keyId: string): Promise<void> {
    this.keys.delete(keyId);
  }

  async clear(): Promise<void> {
    this.keys.clear();
  }
}

/**
 * Create the appropriate key manager based on environment capabilities
 */
export function createSecureKeyManager(): SecureKeyManager {
  try {
    // Check if WebCrypto and IndexedDB are available
    if (typeof crypto !== "undefined" && crypto.subtle && typeof indexedDB !== "undefined") {
      return new WebCryptoKeyManager();
    }
  } catch (error) {
    console.warn("WebCrypto not available, using fallback key manager:", error);
  }

  return new FallbackKeyManager();
}
