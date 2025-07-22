export interface PipeCodecArgs<T> {
  encode: (data: T) => string;
  decode: (data: string) => T;
}

export interface Store {
  // biome-ignore lint/suspicious/noExplicitAny: any is fine here.
  get<K = any>(key: string): Promise<K | undefined>;
  // biome-ignore lint/suspicious/noExplicitAny: any is fine here.
  set<K = any>(key: string, value: K): Promise<void>;
  delete(key: string): Promise<void>;
  reset(): Promise<void>;
  setRememberDuration(duration?: number): Promise<void>;
  pipeCodec<T>(codec: PipeCodecArgs<T>): Store;
}
