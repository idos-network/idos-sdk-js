/**
 * In-memory implementation of the store.
 */

import type { PipeCodecArgs, Store } from "./interface";

export class MemoryStore implements Store {
  readonly REMEMBER_DURATION_KEY = "storage-expiration";
  readonly keyPrefix: string;
  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  private readonly storage: Map<string, any> = new Map();

  constructor(keyPrefix = "idOS-") {
    this.keyPrefix = keyPrefix;
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  async get<K = any>(key: string): Promise<K | undefined> {
    if (this.hasRememberDurationElapsed()) {
      // Duration is expired, reset the store
      // There is nothing else to do here, because the store is in-memory
      this.reset();
      return undefined;
    }

    const prefixedKey = `${this.keyPrefix}${key}`;
    return this.storage.get(prefixedKey);
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  set<K = any>(key: string, value: K): Promise<void> {
    const prefixedKey = `${this.keyPrefix}${key}`;
    this.storage.set(prefixedKey, value);
    return Promise.resolve();
  }

  async reset(): Promise<void> {
    this.storage.clear();
    return Promise.resolve();
  }

  async setRememberDuration(days?: number): Promise<void> {
    const daysNumber =
      !days || Number.isNaN(Number(days)) ? undefined : Number.parseInt(days.toString());

    if (!daysNumber) {
      this.storage.delete(this.REMEMBER_DURATION_KEY);
      return Promise.resolve();
    }

    const date = new Date();
    date.setTime(date.getTime() + daysNumber * 24 * 60 * 60 * 1000);
    this.storage.set(this.REMEMBER_DURATION_KEY, JSON.stringify(date.toISOString()));

    return Promise.resolve();
  }

  hasRememberDurationElapsed(): boolean {
    const value = this.storage.get(this.REMEMBER_DURATION_KEY);
    if (!value) return false;

    // If the value doesn't decode right, we're going to assume that somebody messed around with it.
    // The absence of a value means `false` today. So, we're following suit on the reasoning: consider it absent.
    // Furthermore, since this is not really a recoverable situation, we're going to clean up that stored value.

    let str: string;
    try {
      str = JSON.parse(value);
    } catch (_) {
      this.storage.delete(this.REMEMBER_DURATION_KEY);
      return false;
    }

    const expires = Date.parse(str);
    if (Number.isNaN(expires)) {
      this.storage.delete(this.REMEMBER_DURATION_KEY);
      return false;
    }

    return expires < Date.now();
  }

  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>): MemoryStore {
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
