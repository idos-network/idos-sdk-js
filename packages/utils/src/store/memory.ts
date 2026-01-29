/**
 * In-memory implementation of the store.
 */

import { durationElapsed, setDuration } from "./duration";
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

    return this.storage.get(`${this.keyPrefix}${key}`);
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  set<K = any>(key: string, value: K): Promise<void> {
    this.storage.set(`${this.keyPrefix}${key}`, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.storage.delete(`${this.keyPrefix}${key}`);
    return Promise.resolve();
  }

  async reset(): Promise<void> {
    this.storage.clear();
    return Promise.resolve();
  }

  async setRememberDuration(days?: number): Promise<void> {
    const date = setDuration(days);

    if (!date) {
      this.storage.delete(this.REMEMBER_DURATION_KEY);
    } else {
      this.storage.set(this.REMEMBER_DURATION_KEY, JSON.stringify(date.toISOString()));
    }

    return Promise.resolve();
  }

  hasRememberDurationElapsed(): boolean {
    const value = this.storage.get(this.REMEMBER_DURATION_KEY);

    try {
      return durationElapsed(value);
    } catch (_) {
      this.storage.delete(this.REMEMBER_DURATION_KEY);
      return false;
    }
  }

  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>): MemoryStore {
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
