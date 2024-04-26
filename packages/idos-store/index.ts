interface PipeCodecArgs<T> {
  encode: (o: string) => T;
  decode: (o: T) => string;
}

export class Store {
  keyPrefix = "idOS-";

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

  set(key: string, value: any, days?: number | string) {
    if (!key || typeof key !== "string") throw new Error(`Bad key: ${key}`);
    if (!value) return;

    //@ts-ignore TODO Actually use this.
    const _daysNumber = !days || Number.isNaN(Number(days)) ? undefined : parseInt(days.toString());

    this.#setLocalStorage(key, JSON.stringify(value));
  }

  #getLocalStorage(key: string) {
    return window.localStorage.getItem(`${this.keyPrefix}${key}`);
  }

  #setLocalStorage(key: string, value: string) {
    return window.localStorage.setItem(`${this.keyPrefix}${key}`, value);
  }

  reset() {
    for (const key of Object.keys(window.localStorage)) {
      if (key === "idOS-credential-id") continue;
      if (key.startsWith(this.keyPrefix)) window.localStorage.removeItem(key);
    }
  }
}
