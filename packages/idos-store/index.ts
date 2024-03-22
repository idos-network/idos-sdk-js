interface PipeCodecArgs<T> {
  encode: (o: string) => T;
  decode: (o: T) => string;
}

export class Store {
  keyPrefix = "idOS-";
  cookieExpiries = {
    past: new Date(0).toUTCString(),
    future: new Date(Date.now() + 365 * 3600 * 24 * 1000).toUTCString()
  };

  constructor() {
    this.#rebuild();
  }

  pipeCodec<T>({ encode, decode }: PipeCodecArgs<T>) {
    return {
      ...this,
      get: (key: string) => {
        const result = this.get(key);
        if (result) return decode(result);
      },
      set: (key: string, value: any, days: string | number) =>
        this.set.call(this, key, encode(value), days)
    };
  }

  get(key: string): any {
    const values = [
      this.#getCookie(key),
      this.#getLocalStorage(key),
      this.#getSessionStorage(key)
    ].filter(Boolean) as string[];

    if (!values.length) return;

    if (!values.every((value) => value === values[0]))
      console.warn(
        [
          `Inconsistent idOS store data (${window.location.origin})`,
          `Key: ${key}`,
          `${values.join("\nvs\n")}`
        ].join("\n")
      );

    return values[0] ? JSON.parse(values[0]) : undefined;
  }

  set(key: string, value: any, days?: number | string) {
    if (!key || typeof key !== "string") throw new Error(`Bad key: ${key}`);
    if (!value) return;

    const daysNumber = !days || Number.isNaN(Number(days)) ? undefined : parseInt(days.toString());

    value = JSON.stringify(value);

    if (daysNumber === 0) {
      this.#setSessionStorage(key, value);
    } else {
      this.#setCookie(key, value, daysNumber);
      this.#setLocalStorage(key, value);
    }
  }

  #rebuild() {
    const keysInCookies: string[] = Object.values(
      Object.fromEntries(document.cookie.matchAll(new RegExp(`(${"idOS-"}.*?)=`, "g")))
    );

    const keysInLocalStorage = Object.keys(window.localStorage);

    for (let key of [...new Set(keysInCookies.concat(keysInLocalStorage))]) {
      if (!key) continue;
      key = key.replace(this.keyPrefix, "");
      this.set(key, this.get(key));
    }
  }

  #getCookie(key: string) {
    return document.cookie.match(`${this.keyPrefix}${key}=(.*?)(;|$)`)?.at(1);
  }

  #setCookie(key: string, value: any, days?: number) {
    const expiry = days
      ? new Date(Date.now() + days * 86400 * 1000).toUTCString()
      : this.cookieExpiries.future;

    document.cookie = [
      `${this.keyPrefix}${key}=${value}`,
      `SameSite=None`,
      `Secure`,
      `Expires=${expiry}`
    ].join(";");
  }

  #getLocalStorage(key: string) {
    return window.localStorage.getItem(`${this.keyPrefix}${key}`);
  }

  #getSessionStorage(key: string) {
    return window.sessionStorage.getItem(`${this.keyPrefix}${key}`);
  }

  #setLocalStorage(key: string, value: string) {
    return window.localStorage.setItem(`${this.keyPrefix}${key}`, value);
  }

  #setSessionStorage(key: string, value: string) {
    return window.sessionStorage.setItem(`${this.keyPrefix}${key}`, value);
  }

  reset() {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      for (const key of Object.keys(storage)) {
        if (key === "idOS-credential-id") continue;
        key.startsWith(this.keyPrefix) && storage.removeItem(key);
      }
    }

    const keysInCookies: string[] = Object.values(
      Object.fromEntries(document.cookie.matchAll(new RegExp(`(${"idOS-"}.*?)=`, "g")))
    );

    for (const key of keysInCookies) {
      if (key === "idOS-credential-id" || key === "idOS-preferred-auth-method") continue;
      key.startsWith(this.keyPrefix) &&
        (document.cookie = [
          `${key}=`,
          `SameSite=None`,
          `Secure`,
          `Path=/`,
          `Expires=${this.cookieExpiries.past}`
        ].join(";"));
    }
  }
}
