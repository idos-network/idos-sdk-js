/**
 * Chrome extension implementation of the store.
 */

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
    return result[prefixedKey];
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
    const daysNumber =
      !days || Number.isNaN(Number(days)) ? undefined : Number.parseInt(days.toString());

    if (!daysNumber) {
      await chrome.storage.local.remove(this.REMEMBER_DURATION_KEY);
      return Promise.resolve();
    }

    const date = new Date();
    date.setTime(date.getTime() + daysNumber * 24 * 60 * 60 * 1000);
    await chrome.storage.local.set({
      [this.REMEMBER_DURATION_KEY]: JSON.stringify(date.toISOString()),
    });

    return Promise.resolve();
  }

  async checkRememberDurationElapsed(): Promise<void> {
    if (await this.hasRememberDurationElapsed()) {
      this.reset();
    }
  }

  async hasRememberDurationElapsed(): Promise<boolean> {
    const value = await chrome.storage.local.get(this.REMEMBER_DURATION_KEY);
    if (!value[this.REMEMBER_DURATION_KEY]) return false;

    // If the value doesn't decode right, we're going to assume that somebody messed around with it.
    // The absence of a value means `false` today. So, we're following suit on the reasoning: consider it absent.
    // Furthermore, since this is not really a recoverable situation, we're going to clean up that stored value.

    let str: string;
    try {
      str = JSON.parse(value[this.REMEMBER_DURATION_KEY]);
    } catch (_) {
      await chrome.storage.local.remove(this.REMEMBER_DURATION_KEY);
      return false;
    }

    const expires = Date.parse(str);
    if (Number.isNaN(expires)) {
      await chrome.storage.local.remove(this.REMEMBER_DURATION_KEY);
      return false;
    }

    return expires < Date.now();
  }

  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>): ChromeExtensionStore {
    return {
      ...this,
      // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
      get: async (key: string): Promise<any> => {
        const result = await this.get(key);
        if (result) return decode(result);
      },
      // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
      set: async (key: string, value: any): Promise<void> => {
        await this.set(key, encode(value));
      },
    };
  }
}
