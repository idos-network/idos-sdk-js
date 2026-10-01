import { objects } from "../utils/objects";
import { isValueType, ValueType } from "../utils/types";
import { DataInfo } from "./database";
import { AccessModifier } from "./enums";
import { BytesEncodingStatus } from "./enums";
import { EncodedValue } from "./payload";
import { AnySignatureType, AuthBody, SignerSupplier } from "./signature";

export type Entry<T extends ValueType | ValueType[]> = [string, T];

export type EntryType = Entry<ValueType> | Entry<ValueType[]>;

export type NamedParams = Record<string, ValueType | ValueType[]>;
export type NamedTypes = Record<string, DataInfo>;

export interface ParamsTypes {
  v: ValueType;
  o?: DataInfo;
}

export function resolveParamTypes(
  i: NamedParams | PositionalParams,
  types?: DataInfo[] | NamedTypes,
): ParamsTypes[] {
  const paramTypes: ParamsTypes[] = [];

  // if no types are provided, return paramtypes with no o property
  if (!types) {
    if (isNamedParam(i)) {
      for (const v of Object.values(i)) {
        paramTypes.push({ v });
      }
    } else {
      for (let j = 0; j < i.length; j++) {
        paramTypes.push({ v: i[j] });
      }
    }
    return paramTypes;
  }

  // handle named parameters
  if (isNamedParam(i)) {
    // handle named types
    if (types && !Array.isArray(types)) {
      for (const [k, v] of Object.entries(i)) {
        paramTypes.push({ v, o: types[k] });
      }
    } else {
      // handle positional types, assume the order of the types matches the order of the parameters
      Object.entries(i).forEach(([, v], idx) => {
        paramTypes.push({ v, o: types[idx] });
      });
    }
  } else {
    // handle positional parameters

    // handle named types
    if (types && !Array.isArray(types)) {
      // assume that the order of the types matches the order of the parameters
      const typeVals = Object.values(types);
      for (let j = 0; j < i.length; j++) {
        paramTypes.push({ v: i[j], o: typeVals[j] });
      }
    } else {
      // assume that the order of the types matches the order of the parameters
      for (let j = 0; j < i.length; j++) {
        paramTypes.push({ v: i[j], o: types[j] });
      }
    }
  }
  return paramTypes;
}

export function isNamedParams(i: NamedParams[] | PositionalParams[]): i is NamedParams[] {
  let isNamedParams = false;

  for (const p of i) {
    if (isNamedParam(p)) {
      isNamedParams = true;
      break;
    }
  }

  return isNamedParams;
}

export function isNamedParam(i: NamedParams | PositionalParams): i is NamedParams {
  return typeof i === "object" && i !== null && !Array.isArray(i);
}

export type Predicate = (k: [key: string, v: ValueType | ValueType[]]) => boolean;

export type PositionalParams = ValueType[];

/**
 * ActionBody is the interface for executing an action with the `kwil.execute()` method.
 */
export interface ActionBody {
  /**
   * @deprecated - This field is deprecated and will be removed in the next major release. Please use the 'namespace' field instead.
   * dbid is the database ID of the record on which to execute the action.
   */
  dbid?: string;
  /**
   * namespace is the namespace of the record on which to execute the action.
   */
  namespace: string;
  /**
   * name is the name of the action or procedure to execute.
   */
  name: string;
  /**
   * inputs is an array of objects. Each object can contain string keys with ValueType values.
   * ActionInput[] is deprecated. Please use Record<string, ValueType>[] instead.
   * Example:
   * ```
   * // Old way (deprecated):
   * const input = ActionInput.of().put("name", "Alice").put("age", 25);
   *
   * // New way using named parameters:
   * const input = { name: "Alice", age: 25 };
   *
   * // New way using positional parameters:
   * const input = ["Alice", 25];
   * ```
   */
  inputs?: NamedParams[] | PositionalParams[] | ActionInput[];
  /**
   * types is an array for the data types of each input
   * You can use the DataType enum to specify the data type.
   * Example:
   * ```
   * import { Utils } from 'kwil-js';
   *
   * const { DataType } = Utils;
   *
   * const body = {
   *  inputs: ["Alice", 25, 1.25],
   *  types: [DataType.Text, DataType.Int8, DataType.Numeric(3, 2)]
   * }
   * ```
   *
   * If using named parameters, you can use the NamedTypes interface to specify the data types.
   * Example:
   * ```
   * const body = {
   * inputs: { $name: "Alice", $age: 25, $height: 1.25 },
   * types: { $name: DataType.Text, $age: DataType.Int8, $height: DataType.Numeric(3, 2) }
   * }
   * ``
   */
  types?: DataInfo[] | NamedTypes;
  /**
   * description is an optional description of the action.
   */
  description?: string;
  /**
   * nonce is an optional nonce value for the action.
   */
  nonce?: number;
}

/**
 * CallBody is the interface for calling an action with the `kwil.call()` method.
 */
export interface CallBody {
  /**
   * @deprecated - This field is deprecated and will be removed in the next major release. Please use the 'namespace' field instead.
   * dbid is the database ID of the record on which to execute the action.
   */
  dbid?: string;
  /**
   * namespace is the namespace of the record on which to execute the action.
   */
  namespace: string;
  /**
   * name is the name of the action or procedure to execute.
   */
  name: string;
  /**
   * inputs is an array of objects. Each object can contain string keys with ValueType values.
   * ActionInput[] is deprecated. Please use Record<string, ValueType>[] instead.
   * Example:
   * ```
   * // Old way (deprecated):
   * const input = ActionInput.of().put("name", "Alice").put("age", 25);
   *
   * // New way using named parameters:
   * const input = { name: "Alice", age: 25 };
   *
   * // New way using positional parameters:
   * const input = ["Alice", 25];
   * ```
   */
  inputs?: NamedParams | PositionalParams | ActionInput[];
  /**
   * types is an array for the data types of each input
   * You can use the DataType enum to specify the data type.
   * Example:
   * ```
   * import { Utils } from 'kwil-js';
   *
   * const { DataType } = Utils;
   *
   * const body = {
   *  inputs: ["Alice", 25, 1.25],
   *  types: [DataType.Text, DataType.Int8, DataType.Numeric(3, 2)]
   * }
   * ```
   *
   * If using named parameters, you can use the NamedTypes interface to specify the data types.
   * Example:
   * ```
   * const body = {
   * inputs: { $name: "Alice", $age: 25, $height: 1.25 },
   * types: { $name: DataType.Text, $age: DataType.Int8, $height: DataType.Numeric(3, 2) }
   * }
   * ``
   */
  types?: DataInfo[] | NamedTypes;
  /**
   * authBody is an optional value for the read/view action to be called in private mode
   * AuthBody interface => consisting of the signature and challenge for the message
   */
  authBody?: AuthBody;
}

export interface CallBodyNode extends CallBody {
  cookie?: string;
}

export interface ActionOptions {
  actionName: string;
  namespace: string;
  chainId: string;
  description: string;
  actionInputs: NamedParams[] | PositionalParams[];
  types?: DataInfo[] | NamedTypes;
  signer?: SignerSupplier;
  identifier?: Uint8Array;
  signatureType?: AnySignatureType;
  nonce?: number;
  challenge?: string;
  signature?: BytesEncodingStatus.BASE64_ENCODED;
}

export interface NamespaceAction {
  name: string;
  namespace: string;
  parameter_names: ReadonlyArray<string>;
  parameter_types: ReadonlyArray<string>;
  return_names: ReadonlyArray<string>;
  return_types: ReadonlyArray<string>;
  returns_table: boolean;
  access_modifiers: ReadonlyArray<AccessModifier>;
  built_in: boolean;
  raw_statement: string;
}

export interface ValidatedAction {
  actionName: string;
  modifiers: ReadonlyArray<AccessModifier>;
  encodedActionInputs: EncodedValue[][];
}

/**
 * Asserts that a key is not null or undefined.
 *
 * @param key - The key to assert.
 * @returns The key if it is not null or undefined.
 * @throws Will throw an error if the key is null or undefined.
 */

function assertKey(key: string): string {
  return objects.requireNonNil(key, "key cannot be nil");
}

function lowercaseKey(key: string): string {
  return key.toLowerCase();
}

export const transformActionInput = {
  /**
   * Checks if all elements in the given array are instances of ActionInput.
   *
   * @param {unknown} i - The value to be checked.
   * @returns {boolean} - True if `inputs` is an array where every element is an ActionInput, otherwise false.
   */
  isActionInputArray(i: unknown): i is ActionInput[] {
    return Array.isArray(i) && i.length > 0 && i.every((item) => item instanceof ActionInput);
  },
  /**
   * Transforms action inputs into entries format required by the API.
   * Used to support legacy ActionInput[] when calling a view action where only one input is required.
   *
   * @param {ActionInput[] | NamedParams[]} inputs - The input array to transform
   * @returns {NamedParams[]} - Array containing a single Entries object
   * @throws {Error} - If inputs array is empty
   */
  toSingleEntry(inputs: ActionInput[] | NamedParams[]): NamedParams {
    if (!inputs.length) {
      return {};
    }

    const firstInput = inputs[0];

    if (firstInput instanceof ActionInput) {
      return firstInput.toEntries();
    }

    return firstInput;
  },

  /**
   * Transforms action inputs into entries format required by the API.
   * Used to support legacy ActionInput[] when calling an execute action where multiple inputs may be required.
   *
   * @param {ActionInput[] | NamedParams[]} inputs - The input array to transform
   * @returns {NamedParams[]} - Array containing entries objects
   * @throws {Error} - If inputs array is not valid
   */
  toNamedParams(inputs: ActionInput[] | NamedParams[]): NamedParams[] {
    if (!transformActionInput.isActionInputArray(inputs)) {
      throw new Error("Inputs array  must be an array of Entries or ActionInput objects");
    }

    const np: NamedParams[] = [];
    for (const input of inputs) {
      if (input instanceof ActionInput) {
        np.push(input.toEntries());
      }
    }

    return np;
  },
};

export const transformPositionalParam = {
  /**
   * Checks if all elements in a given array are PositionalParams
   * @param {unknown} i - The value to be checked.
   * @returns {boolean} - True if `inputs` is an array where every element is a PositionalParam, otherwise false.
   */
  isPositionalParams(i: unknown): i is PositionalParams[] {
    return Array.isArray(i) && i.every((p) => isValueType(p));
  },

  /**
   * Checks if a given value is a PositionalParam
   * @param {unknown} i - The value to be checked.
   * @returns {boolean} - True if `i` is a PositionalParam, otherwise false.
   */

  isPositionalParam(i: unknown): i is PositionalParams {
    return isValueType(i);
  },

  /**
   * Transforms positional parameters into named parameters to be used for validation
   *
   * @param {PositionalParams[]} inputs - The input array to transform
   * @returns {NamedParams[]} - Array containing entries objects
   */
  toNamedParams(inputs: PositionalParams[]): NamedParams[] {
    return inputs.map((i) => {
      return transformPositionalParam.toNamedParam(i);
    });
  },

  toNamedParam(i: PositionalParams): NamedParams {
    const np: NamedParams = {};
    i.forEach((v, idx) => {
      np[`$pstn_${idx}`] = v;
    });
    return np;
  },
};

/**
 * @deprecated - This class is deprecated and will be removed in the next major release.  Please pass action inputs as an array of objects.
 * `ActionInput` class is a utility class for creating action inputs.
 */

export class ActionInput implements Iterable<EntryType> {
  private readonly map: NamedParams;

  constructor() {
    this.map = {};
  }

  /**
   * Adds or replaces a value for a single action input.
   *
   * @param key - The action input name.
   * @param value - The value to put for the action input.
   * @returns The current `ActionInput` instance for chaining.
   */

  public put<T extends ValueType>(key: string, value: T): ActionInput {
    const lowerKey = lowercaseKey(key);
    this.map[assertKey(lowerKey)] = value;
    return this;
  }

  /**
   * Adds a value for a single action input if the key is not already present.
   *
   * @param key - The action input name.
   * @param value - The value to put for the action input.
   * @returns The current `ActionInput` instance for chaining.
   */
  public putIfAbsent<T extends ValueType>(key: string, value: T): ActionInput {
    const lowerKey = lowercaseKey(key);
    if (!this.containsKey(lowerKey)) {
      this.map[lowerKey] = value;
    }
    return this;
  }

  /**
   * Replaces a value for a single action input if the key is already present.
   *
   * @param key - The action input name.
   * @param value - The value to replace for the action input.
   * @returns The current `ActionInput` instance for chaining.
   */

  public replace<T extends ValueType>(key: string, value: T): ActionInput {
    const lowerKey = lowercaseKey(key);
    if (this.containsKey(lowerKey)) {
      this.map[lowerKey] = value;
    }
    return this;
  }

  /**
   * Retrieves an action input value given its key.
   *
   * @param key - The action input name.
   * @returns The value associated with the action input name.
   */

  public get<T extends ValueType>(key: string): T {
    const lowerKey = lowercaseKey(key);
    return this.map[assertKey(lowerKey)] as T;
  }

  /**
   * Retrieves a value by its action input name, or a default value if the action input name is not present.
   *
   * @param key - The action input name.
   * @param defaultValue - The default value to return if the key is not present.
   * @returns The value associated with the key, or the default value.
   */

  public getOrDefault<T extends ValueType>(key: string, defaultValue: T): T {
    const lowerKey = lowercaseKey(key);
    return (this.map[assertKey(lowerKey)] ?? defaultValue) as T;
  }

  /**
   * Checks if the map contains a specific action input name.
   *
   * @param key - The action input name.
   * @returns True if the action input name is present, false otherwise.
   */

  public containsKey(key: string): boolean {
    const lowerKey = lowercaseKey(key);
    return this.map.hasOwnProperty(assertKey(lowerKey));
  }

  /**
   * Removes a action input name and its associated value from the map.
   *
   * @param key - The action input name to remove.
   * @returns True if the key was present and is now removed, false otherwise.
   */

  public remove(key: string): boolean {
    const lowerKey = lowercaseKey(key);
    return delete this.map[lowerKey];
  }

  /**
   * Converts the map of action inputs to an array of entries.
   *
   * @param filter - An optional filter function.
   * @returns A read-only array of entries.
   */

  public toArray(filter?: Predicate): ReadonlyArray<EntryType> {
    return Object.entries(this.map).filter(filter ?? (() => true)) as ReadonlyArray<EntryType>;
  }

  /**
   * Transforms the `ActionInput` to JSON.
   *
   * @returns A read-only map of entries.
   */

  public toEntries(): Readonly<NamedParams> {
    return this.map;
  }

  /**
   * Allows `ActionInput` to be iterable.
   *
   * @returns An iterator over the array of entries.
   */

  [Symbol.iterator](): IterableIterator<EntryType> {
    return this.toArray()[Symbol.iterator]();
  }

  /**
   * Adds or replaces values from and object of action name/key-value pairs.
   *
   * @param obj - The object from which to extract action name/key-value pairs.
   * @returns The current `ActionInput` instance for chaining.
   */

  public putFromObject<T extends {}>(obj: T): ActionInput {
    for (let [key, value] of Object.entries(objects.requireNonNil(obj))) {
      key = lowercaseKey(key);
      this.map[assertKey(key)] = value as ValueType;
    }
    return this;
  }

  /**
   * Adds values from and object of action name/key-value pairs if the key is not already present.
   *
   * @param obj - The object from which to extract key-value pairs.
   * @returns The current `ActionInput` instance for chaining.
   */

  public putFromObjectIfAbsent<T extends {}>(obj: T): ActionInput {
    for (let [key, value] of Object.entries(objects.requireNonNil(obj))) {
      key = lowercaseKey(key);
      if (!this.containsKey(key)) {
        this.map[assertKey(key)] = value as ValueType;
      }
    }
    return this;
  }

  /**
   * Replaces values from and object of action name/key-value pairs if the key is already present.
   *
   * @param obj - The object from which to extract key-value pairs.
   * @returns The current `ActionInput` instance for chaining.
   */

  public replaceFromObject<T extends {}>(obj: T): ActionInput {
    for (let [key, value] of Object.entries(objects.requireNonNil(obj))) {
      key = lowercaseKey(key);
      if (this.containsKey(key)) {
        this.map[assertKey(key)] = value as ValueType;
      }
    }
    return this;
  }

  /**
   * Creates multiple `ActionInput` instances from an array of objects.
   *
   * @param objs - An array of objects from which to create `ActionInput` instances.
   * @returns An array of `ActionInput` instances.
   */

  public putFromObjects<T extends {}>(objs: T[]): ActionInput[] {
    const actions: ActionInput[] = [];
    for (const obj of objects.requireNonNil(objs)) {
      actions.push(ActionInput.fromObject(obj));
    }
    return actions;
  }

  /**
   * Factory method to create a new instance of `ActionInput`.
   *
   * @returns A new `ActionInput` instance.
   */

  public static of(): ActionInput {
    return new ActionInput();
  }

  /**
   * Creates a new `ActionInput` instance from an iterable array of entries.
   *
   * @param entries - The iterable of set of entries. Entries should be formatted as an array of `[inputName, value]`.
   * @returns A new `ActionInput` instance.
   */

  public static from(entries: Iterable<EntryType>): ActionInput {
    const action = ActionInput.of();
    for (let [key, value] of entries) {
      key = lowercaseKey(key);
      action.map[assertKey(key)] = value;
    }
    return action;
  }

  /**
   * Creates a new `ActionInput` instance from an object.
   *
   * @param obj - The object from which to create the `ActionInput`.
   * @returns A new `ActionInput` instance.
   */

  public static fromObject<T extends {}>(obj: T): ActionInput {
    const action = ActionInput.of();
    for (let [key, value] of Object.entries(objects.requireNonNil(obj))) {
      key = lowercaseKey(key);
      action.map[assertKey(key)] = value as ValueType;
    }
    return action;
  }

  /**
   * Creates multiple `ActionInput` instances from an array of objects.
   *
   * @param objs - An array of objects from which to create `ActionInput` instances.
   * @returns An array of `ActionInput` instances.
   */

  public static fromObjects<T extends {}>(objs: T[]): ActionInput[] {
    const actions: ActionInput[] = [];
    for (const obj of objects.requireNonNil(objs)) {
      actions.push(ActionInput.fromObject(obj));
    }
    return actions;
  }
}
