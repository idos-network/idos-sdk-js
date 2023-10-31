export class Store {
  keyPrefix = "idOS-";
  #data = {};

  constructor({ initWith: keys }) {
    keys.forEach((key) => this.get(key));
  }

  get(key, { json } = {}) {
    if (!this.#data[key]) {
      const values = [this.#getCookie(key), this.#getLocalStorage(key)].filter(Boolean);
      const firstValue = values.shift(1);
      if (!values.filter((v) => !!v).every((v) => v && v === firstValue)) {
        console.warn(`Inconsistent idOS store data (${window.location.origin})`);
      }
      this.#data[key] = firstValue;
    }
    return json ? this.#data[key] && JSON.parse(this.#data[key]) : this.#data[key];
  }

  set(key, value, { json } = {}) {
    if (typeof key !== "string" || !key) {
      throw new Error("Storage key not provided");
    }

    if (!value) {
      return;
    }

    value = json ? JSON.stringify(value) : value;

    this.#data[key] = value;
    this.#setCookie(key, value);
    this.#setLocalStorage(key, value);
  }

  #getCookie(key) {
    return document.cookie.match(`${this.keyPrefix}${key}=(.*?)(;|$)`)?.at(1);
  }

  #setCookie(key, value) {
    return (document.cookie = `${this.keyPrefix}${key}=${value}; SameSite=None; Secure`);
  }

  #getLocalStorage(key) {
    return window.localStorage.getItem(`${this.keyPrefix}${key}`);
  }

  #setLocalStorage(key, value) {
    return window.localStorage.setItem(`${this.keyPrefix}${key}`, value);
  }

  async reset({ keep = [] } = {}) {
    keep = keep.map(name => `${this.keyPrefix}${name}`);

    for (const name of Object.keys(window.localStorage)) {
      if (!name.startsWith(this.keyPrefix)) continue;
      if (keep.includes(name)) continue;

      window.localStorage.removeItem(name);
    }

    for (const { name } of await cookieStore.getAll()) {
      if (!name.startsWith(this.keyPrefix)) continue;
      if (keep.includes(name)) continue;

      document.cookie = [
        `${name}=`,
        `SameSite=None`,
        `Secure`,
        `Path=/`,
        `Expires=Thu, 01 Jan 1970 00:00:01 GMT`,
      ].join(";");
    }
  }
}
