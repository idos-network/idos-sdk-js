export class Store {
  data = {};
  keys = [
    "human-id",
    "signer-public-key",
  ];

  constructor() {
    this.keys.forEach(key => (this.get(key)));
  }

  get (key) {
    if (!this.data[key]) {
      const values = [this.#getCookie(key), this.#getLocalStorage(key)];
      const firstValue = values.shift(1);

      if (!values.filter(v => !!v).every(v => (v && v === firstValue))) {
        throw new Error("Inconsistent data");
      }

      this.data[key] = firstValue;
    }

    return this.data[key];
  }

  set (key, value) {
    if (!key || !value) {
      return;
    }

    this.data[key] = value;

    this.#setCookie(key, value);
    this.#setLocalStorage(key, value);
  }

  #getCookie (key) {
    return document.cookie.match(`idos-${key}=(.*?)(;|$)`)?.at(1);    
  }

  #setCookie (key, value) {
    return document.cookie = `idos-${key}=${value}; SameSite=None; Secure`;
  }

  #getLocalStorage (key) {
    return window.localStorage.getItem(`idos-${key}`);
  }

  #setLocalStorage (key, value) {
    return window.localStorage.setItem(`idos-${key}`, value);
  }
}
