/**
 * Local storage implementation of the store
 */

import { durationElapsed, setDuration } from "./duration";
import type { PipeCodecArgs, Store } from "./interface";

export class LocalStorageStore implements Store {
  readonly keyPrefix: string;
  readonly storage: Storage;
  readonly REMEMBER_DURATION_KEY = "storage-expiration";

  // @ts-expect-error window is defined in the library mode, that's fine
  constructor(storage: Storage = window.localStorage, keyPrefix = "idOS-") {
    this.storage = storage;
    this.keyPrefix = keyPrefix;
    this.checkRememberDurationElapsed();
  }

  #setLocalStorage(key: string, value: string): void {
    this.storage.setItem(`${this.keyPrefix}${key}`, value);
  }

  #getLocalStorage(key: string): string | null {
    return this.storage.getItem(`${this.keyPrefix}${key}`);
  }

  #removeLocalStorage(key: string): void {
    this.storage.removeItem(`${this.keyPrefix}${key}`);
  }

  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>): LocalStorageStore {
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

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  get<K = any>(key: string): Promise<K | undefined> {
    const value = this.#getLocalStorage(key);

    if (!value) {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(JSON.parse(value) as K);
  }

  setRememberDuration(days?: number): Promise<void> {
    const date = setDuration(days);

    if (!date) {
      this.#removeLocalStorage(this.REMEMBER_DURATION_KEY);
    } else {
      this.#setLocalStorage(this.REMEMBER_DURATION_KEY, JSON.stringify(date.toISOString()));
    }

    return Promise.resolve();
  }

  async checkRememberDurationElapsed(): Promise<void> {
    if (await this.hasRememberDurationElapsed()) {
      await this.reset();
    }
  }

  async hasRememberDurationElapsed(): Promise<boolean> {
    const value = this.#getLocalStorage(this.REMEMBER_DURATION_KEY);

    try {
      return durationElapsed(value);
    } catch (_) {
      this.#removeLocalStorage(this.REMEMBER_DURATION_KEY);
      return false;
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  set<K = any>(key: string, value: K): Promise<void> {
    if (!key || typeof key !== "string") {
      throw new Error(`Bad key: ${key}`);
    }

    if (!value) {
      return Promise.resolve();
    }

    this.#setLocalStorage(key, JSON.stringify(value));
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.#removeLocalStorage(key);
    return Promise.resolve();
  }

  async reset(): Promise<void> {
    for (const key of Object.keys(this.storage)) {
      if (key.startsWith(this.keyPrefix)) {
        this.storage.removeItem(key);
      }
    }
  }
}
