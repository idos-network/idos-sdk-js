import { objects } from "./objects";
import { Func, Nillable, NonNil } from "./types";

export const strings = {
  is: (value: any): boolean => {
    return typeof value === "string";
  },
  // If value is null or undefined, then an error is thrown, else
  // value is returned.
  requireNonNil: (
    value: string | null | undefined,
    message?: string | (() => Error),
  ): NonNil<string> => {
    if (strings.is(value)) {
      return value as string;
    }

    if (typeof message === "function") {
      throw message();
    }

    throw new Error(
      "value is not a string, it is a " + (!value ? "null or undefined" : typeof value),
    );
  },
  // If value is null or undefined, then an error is thrown, else
  // value is returned.
  requireNonNilElse: (
    value: Nillable<string>,
    defaultValue?: NonNil<string> | Func<Nillable<string>, string>,
  ): NonNil<string> => {
    if (!objects.isNil(value)) {
      // @ts-ignore: Unreachable code error
      return value;
    }

    if (typeof defaultValue === "function") {
      (defaultValue as Func<Nillable<string>, string>)(value);
    }

    if (strings.is(defaultValue)) {
      return defaultValue as string;
    }

    throw new Error(
      "defaultValue is not a string, it is a " + (!value ? "null or undefined" : typeof value),
    );
  },
  // NOTE: Will throw an exception if not a string/null/undefined.
  isNilOrEmpty: (value: Nillable<string>): boolean => {
    if (objects.isNil(value)) {
      return true;
    }

    if (strings.is(value)) {
      return value === "";
    }

    throw new Error(
      "value is not a string or null, it is a " + (!value ? "undefined" : typeof value),
    );
  },
  // NOTE: Will throw an exception if not a string/null/undefined.
  isNilOrWhitespace: (value: Nillable<string>): boolean => {
    // @ts-ignore: Unreachable code error
    return strings.isNilOrEmpty(value) || value.trim().length === 0;
  },
};
