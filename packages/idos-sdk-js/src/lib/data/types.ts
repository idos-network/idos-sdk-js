export interface DataLayer<T> {
  list(): Promise<T[]>;
  createMultiple(records: T[], synchronous?: boolean): Promise<T[]>;
  create(record: T, synchronous?: boolean): Promise<T>;
  get(id: string): Promise<T | null>;
}
