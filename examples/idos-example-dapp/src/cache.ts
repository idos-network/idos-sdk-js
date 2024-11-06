export class Cache {
  store: Storage;
  constructor(store = window.localStorage) {
    this.store = store;
  }

  get<T>(key: string): T | null {
    // biome-ignore lint/style/noNonNullAssertion: JSON.parse does accept null. It just returns null.
    return JSON.parse(this.store.getItem(key)!, (k, v) => (v?.bigint ? BigInt(v.bigint) : v));
  }

  // biome-ignore lint/suspicious/noExplicitAny: Same API as JSON.stringify.
  set(key: string, value: any): string {
    const serializedValue = JSON.stringify(value, (k, v) =>
      typeof v === "bigint" ? { bigint: v.toString() } : v,
    );
    this.store.setItem(key, serializedValue);
    return serializedValue;
  }
}
