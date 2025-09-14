/**
 * IndexedDB implementation of the store
 * This provides better security for storing cryptographic keys compared to localStorage
 */

import { durationElapsed, setDuration } from "./duration";
import type { PipeCodecArgs, Store } from "./interface";

export class IndexedDBStore implements Store {
  // biome-ignore lint/suspicious/noExplicitAny: IndexedDB types not available in all environments
  private db: any = null;
  private dbName: string;
  private version: number;
  private storeName: string;
  readonly keyPrefix: string;
  readonly REMEMBER_DURATION_KEY = "storage-expiration";

  constructor(
    dbName = "idOS-Store",
    version = 1,
    storeName = "keyValueStore",
    keyPrefix = "idOS-",
  ) {
    this.dbName = dbName;
    this.version = version;
    this.storeName = storeName;
    this.keyPrefix = keyPrefix;
  }

  /**
   * Initialize the IndexedDB database
   */
  // biome-ignore lint/suspicious/noExplicitAny: IndexedDB types not available in all environments
  private async initDB(): Promise<any> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      // biome-ignore lint/suspicious/noExplicitAny: Need to access global IndexedDB
      const idb = (globalThis as any).indexedDB;
      if (!idb) {
        reject(new Error("IndexedDB not available"));
        return;
      }

      const request = idb.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      // biome-ignore lint/suspicious/noExplicitAny: IndexedDB event types not available
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: "key" });

          // Create an index for key lookup (optional but helpful for performance)
          objectStore.createIndex("key", "key", { unique: true });
        }
      };
    });
  }

  /**
   * Get the prefixed key
   */
  private getPrefixedKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Perform a transaction on the object store
   */
  private async performTransaction<T>(
    mode: string,
    // biome-ignore lint/suspicious/noExplicitAny: IndexedDB store types not available
    operation: (store: any) => any,
  ): Promise<T> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], mode);
      const store = transaction.objectStore(this.storeName);

      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error}`));
      };

      const request = operation(store);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Operation failed: ${request.error}`));
      };
    });
  }

  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>): IndexedDBStore {
    const codedStore = Object.create(this);

    // Override get and set methods with codec
    codedStore.get = async (key: string) => {
      const result = await this.get(key);
      if (result) return decode(result);
      return undefined;
    };

    // biome-ignore lint/suspicious/noExplicitAny: any is fine here for codec compatibility
    codedStore.set = async (key: string, value: any) => {
      await this.set(key, encode(value));
    };

    return codedStore;
  }

  // biome-ignore lint/suspicious/noExplicitAny: any is fine here for store interface compatibility
  async get<K = any>(key: string): Promise<K | undefined> {
    try {
      const prefixedKey = this.getPrefixedKey(key);

      const result = await this.performTransaction("readonly", (store) => store.get(prefixedKey));

      if (!result || typeof result !== "object" || !("value" in result)) {
        return undefined;
      }

      return JSON.parse(String(result.value)) as K;
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      return undefined;
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: any is fine here for store interface compatibility
  async set<K = any>(key: string, value: K): Promise<void> {
    if (!key || typeof key !== "string") {
      throw new Error(`Bad key: ${key}`);
    }

    if (!value) {
      return;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedValue = JSON.stringify(value);

      await this.performTransaction("readwrite", (store) =>
        store.put({ key: prefixedKey, value: serializedValue }),
      );
    } catch (error) {
      throw new Error(`Error setting key ${key}: ${error}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);

      await this.performTransaction("readwrite", (store) => store.delete(prefixedKey));
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.performTransaction("readwrite", (store) => store.clear());
    } catch (error) {
      console.error("Error resetting store:", error);
    }
  }

  async setRememberDuration(days?: number): Promise<void> {
    const date = setDuration(days);

    if (!date) {
      await this.delete(this.REMEMBER_DURATION_KEY);
    } else {
      await this.set(this.REMEMBER_DURATION_KEY, date.toISOString());
    }
  }

  async checkRememberDurationElapsed(): Promise<void> {
    if (await this.hasRememberDurationElapsed()) {
      await this.reset();
    }
  }

  async hasRememberDurationElapsed(): Promise<boolean> {
    try {
      const value = await this.get<string>(this.REMEMBER_DURATION_KEY);
      return durationElapsed(value);
    } catch (_) {
      await this.delete(this.REMEMBER_DURATION_KEY);
      return false;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
