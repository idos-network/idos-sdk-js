import { EncodedParameterValue } from "../core/payload";
import { NillableError, objects } from "./objects";

// represents a value that can be either null or undefined.
export type Nil = null | undefined;
// excludes null and undefined from the type
export type NonNil<T> = T extends Nil ? never : T;
// allowed to be either the original type or null/undefined.
export type Nillable<T> = T | Nil;
export type Supplier<T> = () => T;
export type Func<T, U> = (t: T) => U;
export type Unary<T> = Func<T, T>;
export type Runnable = () => void;

// should be recursive, can allow each property to be undefined or null
export type PartialNillable<T> = {
  [K in keyof T]?: Nillable<T[K] extends object ? PartialNillable<T[K]> : T[K]>;
};

/**
 * A string that represents a hex encoded value.
 */
export type HexString = string;
export type Base64String = string;

export type Promisy<T> = T extends null | undefined
  ? never
  : T extends (...x: any[]) => any
    ? T
    : T extends Function
      ? never
      : T;

export namespace Promisy {
  // If promisy is null or undefined, throws NillableError, else
  // returns value from Promisy.
  export async function resolve<T>(promisy: Promisy<T>): Promise<T> {
    const fov = objects.requireNonNil(promisy);
    const awaitable = typeof fov === "function" ? fov() : fov;
    return await awaitable;
  }

  // If promisy is null or undefined, returns a rejected
  // Promise else returns result of resolve(promisy)
  export async function resolveOrReject<T>(
    promisy: Nillable<Promisy<T>>,
    nilError?: string,
  ): Promise<T> {
    return objects.isNil(promisy)
      ? Promise.reject<T>(new NillableError(nilError))
      : resolve(promisy as Promisy<T>);
  }
}

type UUID = string;

/**
 * ValueType is the type of the data in the database.
 *
 * If you are sending bytes to a blob column, you must send it as a Uint8Array. If you send a string to blob column, it will be converted to base64.
 */
export type ValueType =
  | string
  | number
  | null
  | undefined
  | Array<ValueType>
  | boolean
  | Uint8Array
  | UUID;

export function isValueType(v: unknown): v is ValueType {
  if (
    v === null ||
    v === undefined ||
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean" ||
    v instanceof Uint8Array
  ) {
    return true;
  }

  if (Array.isArray(v)) {
    return v.every(isValueType);
  }

  return false;
}
/**
 * QueryParams is a type for the parameters used within query.
 */
export type QueryParams = Record<string, ValueType>;

export type EncodedQueryParams = Record<string, EncodedParameterValue>;
