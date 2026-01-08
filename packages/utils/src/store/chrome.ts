/**
 * Chrome extension implementation of the store.
 */

import { durationElapsed, setDuration } from "./duration";
import type { PipeCodecArgs, Store } from "./interface";

export class ChromeExtensionStore implements Store {
  readonly REMEMBER_DURATION_KEY = "storage-expiration";
  readonly keyPrefix: string;

  constructor(keyPrefix = "idOS-") {
    this.keyPrefix = keyPrefix;
    this.checkRememberDurationElapsed();
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  async get<K = any>(key: string): Promise<K | undefined> {
    const prefixedKey = `${this.keyPrefix}${key}`;
    const result = await chrome.storage.local.get(prefixedKey);
    return result[prefixedKey] as K | undefined;
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  set<K = any>(key: string, value: K): Promise<void> {
    const prefixedKey = `${this.keyPrefix}${key}`;
    return chrome.storage.local.set({ [prefixedKey]: value });
  }

  delete(key: string): Promise<void> {
    const prefixedKey = `${this.keyPrefix}${key}`;
    return chrome.storage.local.remove(prefixedKey);
  }

  async reset(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter((key) => key.startsWith(this.keyPrefix));
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  async setRememberDuration(days?: number): Promise<void> {
    const date = setDuration(days);

    if (!date) {
      await chrome.storage.local.remove(this.REMEMBER_DURATION_KEY);
    } else {
      await chrome.storage.local.set({
        [this.REMEMBER_DURATION_KEY]: JSON.stringify(date.toISOString()),
      });
    }

    return Promise.resolve();
  }

  async checkRememberDurationElapsed(): Promise<void> {
    if (await this.hasRememberDurationElapsed()) {
      await this.reset();
    }
  }

  async hasRememberDurationElapsed(): Promise<boolean> {
    const value = await chrome.storage.local.get(this.REMEMBER_DURATION_KEY);

    try {
      return durationElapsed(value[this.REMEMBER_DURATION_KEY] as string | null);
    } catch (_) {
      await chrome.storage.local.remove(this.REMEMBER_DURATION_KEY);
      return false;
    }
  }

  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>): ChromeExtensionStore {
    const store = Object.create(Object.getPrototypeOf(this));
    Object.assign(store, this);

    store.get = async (key: string): Promise<T | undefined> => {
      const result = await this.get(key);
      if (result) return decode(result);
    };

    store.set = async (key: string, value: T): Promise<void> => {
      await this.set(key, encode(value));
    };

    return store;
  }
}
