import { NonNil } from "./types";

const NillablErrorSymbol = Symbol();
const NILL_ERROR_MESSAGE = "value cannot be null or undefined";

export class NillableError extends Error {
  public constructor(message: NonNil<string> = NILL_ERROR_MESSAGE) {
    super((message as any) || NILL_ERROR_MESSAGE);
  }

  private get [NillablErrorSymbol]() {
    return true;
  }
}

export const objects = {
  isNilError: (error: Error): boolean => {
    return (error as NillableError)[NillablErrorSymbol] === true;
  },
  // returns true if the value is null or undefined,
  // else will return false.
  isNil: <T>(value: T): boolean => {
    return value === null || value === undefined;
  },
  // returns false if the value is null or undefined,
  // else will return true.
  isNotNil: <T>(value: T): boolean => {
    return !objects.isNil(value);
  },
  /**
   * Helper function to validate required fields with a requireNonNil error.
   * @param values An object containing field names and their corresponding values.
   * @param errorMessageTemplate A function to generate error messages dynamically.
   */
  validateFields: <T extends Record<string, any>>(
    values: T,
    errorMessageTemplate: (fieldName: keyof T) => string,
  ): { [K in keyof T]: NonNil<T[K]> } => {
    for (const key in values) {
      objects.requireNonNil(values[key], errorMessageTemplate(key));
    }
    return values;
  },
  // If value is null or undefined, then an error is thrown, else
  // value is returned.
  requireNonNil: <T>(value: T, message?: string | ((v: T) => Error)): NonNil<T> => {
    if (!objects.isNil(value)) {
      return value as NonNil<T>;
    }

    if (typeof message === "function") {
      throw message(value);
    }

    throw new NillableError(message);
  },
  // If value is null or undefined, then an error is thrown, else
  // value is returned.
  requireNonNilNumber: <T>(value: T, message?: string | ((v: T) => Error)): NonNil<number> => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof message === "function") {
      throw message(value);
    }

    if (!value) {
      throw new NillableError(message);
    }

    throw new Error("value is not a number, it is a " + typeof value);
  },
  requireMaxLength: <T extends { toString(): string }>(
    value: T,
    maxLength: number,
    message?: string | ((v: T) => Error),
  ): NonNil<T> => {
    if (!value) {
      if (typeof message === "function") {
        throw message(value);
      }
      throw new Error(message || "value is null or undefined");
    }

    if (typeof value.toString !== "function") {
      throw new Error("value does not have a toString() method");
    }

    if (value.toString().length > maxLength) {
      if (typeof message === "function") {
        throw message(value);
      }

      throw new Error(message || `value is longer than ${maxLength} characters`);
    }

    return value as NonNil<T>;
  },
  /**
   * Validates that optional parameters, if provided, are not null.
   *
   * @param options - The options object containing the parameters to validate.
   * @param fields - An array of field names to validate.
   * @throws Error if any field is explicitly provided but null.
   */
  validateOptionalFields<T>(options: T, fields: (keyof T)[]): void {
    fields.forEach((field) => {
      if (options[field] !== undefined && options[field] === null) {
        throw new Error(`${String(field)} must not be null.`);
      }
    });
  },
  /**
   * Validates required parameters for the class or function, are not null or undefined.
   *
   * @param options - The options object containing the parameters to validate.
   * @param fields - An array of field names to validate.
   * @throws Error if any field is explicitly provided but null.
   */
  validateRequiredFields<T>(options: T, fields: (keyof T)[]): T {
    fields.forEach((field) => {
      if (options[field] === undefined && options[field] === null) {
        throw new Error(`${String(field)} must not be null.`);
      }
    });
    return options;
  },
};
