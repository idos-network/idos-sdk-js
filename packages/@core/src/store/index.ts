interface PipeCodecArgs<T> {
  encode: (o: string) => T;
  decode: (o: T) => string;
}

export class Store {
  keyPrefix = "idOS-";
  readonly storage: Storage;
  readonly REMEMBER_DURATION_KEY = "storage-expiration";

  constructor(storage: Storage) {
    this.storage = storage;
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

  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>): Store {
    return {
      ...this,
      // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
      get: (key: string): any => {
        const result = this.get(key);
        if (result) return decode(result);
      },
      // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
      set: (key: string, value: any): void => this.set.call(this, key, encode(value)),
    };
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here.
  get(key: string): any {
    const value = this.#getLocalStorage(key);

    if (!value) {
      return undefined;
    }

    return JSON.parse(value);
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

  hasRememberDurationElapsed(): boolean {
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
  set(key: string, value: any): void {
    if (!key || typeof key !== "string") {
      throw new Error(`Bad key: ${key}`);
    }

    if (!value) {
      return;
    }

    this.#setLocalStorage(key, JSON.stringify(value));
  }

  reset(): void {
    for (const key of Object.keys(this.storage)) {
      if (key.startsWith(this.keyPrefix)) {
        this.storage.removeItem(key);
      }
    }
  }
}
