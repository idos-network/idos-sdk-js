export class Store {
  #data = {};

  constructor({ initWith: keys }) {
    keys.forEach((key) => this.get(key));
  }

  get(key) {
    if (!this.#data[key]) {
      const values = [this.#getCookie(key), this.#getLocalStorage(key)].filter(
        Boolean
      );
      const firstValue = values.shift(1);
      if (!values.filter((v) => !!v).every((v) => v && v === firstValue)) {
        throw new Error("Inconsistent data");
      }
      this.#data[key] = firstValue;
    }
    return this.#data[key];
  }

  set(key, value, force = false) {
    if (typeof key !== "string" || !key) {
      throw new Error("Storage key not provided");
    }
    if ((typeof value !== "string" || !value) && force !== true) {
      return;
    }
    this.#data[key] = value;
    this.#setCookie(key, value);
    this.#setLocalStorage(key, value);
  }

  #getCookie(key) {
    return document.cookie.match(`idos-${key}=(.*?)(;|$)`)?.at(1);
  }

  #setCookie(key, value) {
    return (document.cookie = `idos-${key}=${value}; SameSite=None; Secure`);
  }

  #getLocalStorage(key) {
    return window.localStorage.getItem(`idos-${key}`);
  }

  #setLocalStorage(key, value) {
    return window.localStorage.setItem(`idos-${key}`, value);
  }

  async reset() {
    window.localStorage.clear();
    for (const { name } of await cookieStore.getAll()) {
      document.cookie = `${name}=; SameSite=None; Secure; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    }
  }
}
