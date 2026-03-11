export interface PipeCodecArgs<T> {
  encode: (data: T) => string;
  decode: (data: string) => T;
}

export interface Store {
  // oxlint-disable-next-line typescript/no-explicit-any -- any is fine here.
  get<K = any>(key: string): Promise<K | undefined>;
  // oxlint-disable-next-line typescript/no-explicit-any -- any is fine here.
  set<K = any>(key: string, value: K): Promise<void>;
  delete(key: string): Promise<void>;
  reset(): Promise<void>;
  setRememberDuration(duration?: number): Promise<void>;
  pipeCodec<T>(codec: PipeCodecArgs<T>): Store;
}
