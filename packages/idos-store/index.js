export class Store {
  keyPrefix = "idOS-";
  cookieExpiries = {
    past: new Date(0).toUTCString(),
    future: new Date(Date.now() + 365 * 3600 * 24 * 1000).toUTCString()
  };

  constructor() {
    this.#rebuild();
  }

  pipeCodec({ encode, decode }) {
    return {
      ...this,
      get: (key) => {
        const result = this.get(key);
        if (result) return decode(result);
      },
      set: (key, value, days) => this.set.call(this, key, encode(value), days)
    };
  }

  get(key) {
    const values = [
      this.#getCookie(key),
      this.#getLocalStorage(key),
      this.#getSessionStorage(key)
    ].filter(Boolean);

    if (!values.length) return;

    if (!values.every((value) => value === values[0]))
      console.warn(
        [
          `Inconsistent idOS store data (${window.location.origin})`,
          `${values.join("\nvs\n")}`
        ].join("\n")
      );

    return values[0] ? JSON.parse(values[0]) : undefined;
  }

  set(key, value, days) {
    if (!key || typeof key !== "string") throw new Error(`Bad key: ${key}`);
    if (!value) return;

    days = isNaN(Number(days)) ? undefined : parseInt(days);

    value = JSON.stringify(value);

    if (days === 0) {
      this.#setSessionStorage(key, value);
    } else {
      this.#setCookie(key, value, days);
      this.#setLocalStorage(key, value);
    }
  }

  #rebuild() {
    const keysInCookies = Object.values(
      Object.fromEntries(
        document.cookie.matchAll(new RegExp(`(${"idOS-"}.*?)=`, "g"))
      )
    );

    const keysInLocalStorage = Object.keys(window.localStorage);

    for (let key of [...new Set(keysInCookies.concat(keysInLocalStorage))]) {
      key = key.replace(this.keyPrefix, "");
      this.set(key, this.get(key));
    }
  }

  #getCookie(key) {
    return document.cookie.match(`${this.keyPrefix}${key}=(.*?)(;|$)`)?.at(1);
  }

  #setCookie(key, value, days) {
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

  #getLocalStorage(key) {
    return window.localStorage.getItem(`${this.keyPrefix}${key}`);
  }

  #getSessionStorage(key) {
    return window.sessionStorage.getItem(`${this.keyPrefix}${key}`);
  }

  #setLocalStorage(key, value) {
    return window.localStorage.setItem(`${this.keyPrefix}${key}`, value);
  }

  #setSessionStorage(key, value) {
    return window.sessionStorage.setItem(`${this.keyPrefix}${key}`, value);
  }

  reset() {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      for (const key of Object.keys(storage)) {
        if (key === "idOS-credential-id") continue;
        key.startsWith(this.keyPrefix) && storage.removeItem(key);
      }
    }

    const keysInCookies = Object.values(
      Object.fromEntries(
        document.cookie.matchAll(new RegExp(`(${"idOS-"}.*?)=`, "g"))
      )
    );

    for (const key of keysInCookies) {
      if (key === "idOS-credential-id") continue;
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
