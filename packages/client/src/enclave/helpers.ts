/** biome-ignore-all lint/suspicious/noExplicitAny: any is fine here. */
import type { BaseProvider } from "@idos-network/enclave";

type BaseProviderInstance = typeof BaseProvider.prototype & {
  // Custom method from enclave to ensure <-> iframe communication
  signTypedDataResponse: (signature: string) => Promise<void>;
};

// Gets the method argument type
export type MethodArg<T> = T extends (arg: infer A) => any ? A : never;

// Gets the method return type
export type MethodReturn<T> = T extends (...args: any[]) => infer R ? R : never;

export type BaseProviderMethodArgs = {
  [K in keyof BaseProviderInstance as BaseProviderInstance[K] extends (...args: any[]) => any
    ? K
    : never]: Parameters<BaseProviderInstance[K]>;
};

export type BaseProviderMethodReturn = {
  [K in keyof BaseProviderInstance as BaseProviderInstance[K] extends (...args: any[]) => any
    ? K
    : never]: ReturnType<BaseProviderInstance[K]>;
};
