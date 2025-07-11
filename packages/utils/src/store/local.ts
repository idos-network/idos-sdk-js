/**
 * Local storage implementation of the store
 */

import type { PipeCodecArgs, Store } from "./interface";

export class LocalStorageStore implements Store {
  readonly keyPrefix: string;
  readonly storage: Storage;
  readonly REMEMBER_DURATION_KEY = "storage-expiration";

  // @ts-expect-error window is defined in the library mode, that's fine
  constructor(storage: Storage = window.localStorage, keyPrefix = "idOS-") {
    this.storage = storage;
    this.keyPrefix = keyPrefix;
    if (this.hasRememberDurationElapsed()) {
      this.reset();
    }
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

  setRememberDuration(days?: number | string): void {
    const daysNumber =
      !days || Number.isNaN(Number(days)) ? undefined : Number.parseInt(days.toString());

    if (!daysNumber) {
      this.#removeLocalStorage(this.REMEMBER_DURATION_KEY);
      return;
    }

    const date = new Date();
    date.setTime(date.getTime() + daysNumber * 24 * 60 * 60 * 1000);
    this.#setLocalStorage(this.REMEMBER_DURATION_KEY, JSON.stringify(date.toISOString()));
  }

  async checkRememberDurationElapsed(): Promise<void> {
    if (await this.hasRememberDurationElapsed()) {
      this.reset();
    }
  }

  async hasRememberDurationElapsed(): Promise<boolean> {
    const value = this.#getLocalStorage(this.REMEMBER_DURATION_KEY);
    if (!value) return false;

    // If the value doesn't decode right, we're going to assume that somebody messed around with it.
    // The absence of a value means `false` today. So, we're following suit on the reasoning: consider it absent.
    // Furthermore, since this is not really a recoverable situation, we're going to clean up that stored value.

    let str: string;
    try {
      str = JSON.parse(value);
    } catch (_) {
      this.#removeLocalStorage(this.REMEMBER_DURATION_KEY);
      return false;
    }

    const expires = Date.parse(str);
    if (Number.isNaN(expires)) {
      this.#removeLocalStorage(this.REMEMBER_DURATION_KEY);
      return false;
    }

    return expires < Date.now();
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

  async reset(): Promise<void> {
    for (const key of Object.keys(this.storage)) {
      if (key.startsWith(this.keyPrefix)) {
        this.storage.removeItem(key);
      }
    }
  }
}
