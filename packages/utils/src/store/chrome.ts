/**
 * Chrome extension implementation of the store.
 */

import type { PipeCodecArgs, Store } from "./interface";

export class ChromeExtensionStore implements Store {
  readonly keyPrefix: string;

  constructor(keyPrefix = "idOS-") {
    this.keyPrefix = keyPrefix;
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  get<K = any>(key: string): Promise<K | undefined> {
    return chrome.storage.local
      .get(`${this.keyPrefix}${key}`)
      .then((result) => JSON.parse(result[key]));
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  set<K = any>(key: string, value: K): Promise<void> {
    return chrome.storage.local.set({ [`${this.keyPrefix}${key}`]: value });
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
