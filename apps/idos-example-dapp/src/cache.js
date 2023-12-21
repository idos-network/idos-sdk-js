export class Cache {
  constructor(store = window.localStorage) {
    this.store = store;
  }

  get(key) {
    return JSON.parse(this.store.getItem(key), (k, v) => (v && v.bigint ? BigInt(v.bigint) : v));
  }

  set(key, value) {
    return (this.store[key] = JSON.stringify(value, (k, v) =>
      typeof v === "bigint" ? { bigint: v.toString() } : v
    ));
  }
}
