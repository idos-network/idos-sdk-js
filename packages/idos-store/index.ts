interface PipeCodecArgs<T> {
  encode: (o: string) => T;
  decode: (o: T) => string;
}

export class Store {
  keyPrefix = "idOS-";

  readonly REMEMBER_DURATION_KEY = "storage-expiration";

  constructor() {
    if (this.hasRememberDurationElapsed()) this.reset();
  }

  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>) {
    return {
      ...this,
      get: (key: string) => {
        const result = this.get(key);
        if (result) return decode(result);
      },
      set: (key: string, value: any, days: string | number) =>
        this.set.call(this, key, encode(value), days),
    };
  }

  get(key: string): any {
    const value = this.#getLocalStorage(key);
    if (!value) return undefined;

    return JSON.parse(value);
  }

  setRememberDuration(days?: number | string) {
    const daysNumber = !days || Number.isNaN(Number(days)) ? undefined : parseInt(days.toString());

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

    let str;
    try {
      str = JSON.parse(value);
    } catch (error) {
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

  set(key: string, value: any) {
    if (!key || typeof key !== "string") throw new Error(`Bad key: ${key}`);
    if (!value) return;

    this.#setLocalStorage(key, JSON.stringify(value));
  }

  #getLocalStorage(key: string) {
    return window.localStorage.getItem(`${this.keyPrefix}${key}`);
  }

  #setLocalStorage(key: string, value: string) {
    return window.localStorage.setItem(`${this.keyPrefix}${key}`, value);
  }

  #removeLocalStorage(key: string) {
    return window.localStorage.removeItem(`${this.keyPrefix}${key}`);
  }

  reset() {
    for (const key of Object.keys(window.localStorage)) {
      if (key === "idOS-credential-id") continue;
      if (key.startsWith(this.keyPrefix)) window.localStorage.removeItem(key);
    }
  }
}
