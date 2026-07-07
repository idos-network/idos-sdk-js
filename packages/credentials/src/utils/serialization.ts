import { fileToBase85 } from "@idos-network/utils/codecs";

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function convertValues<K extends Record<string, unknown>>(
  fields: K,
  prefix?: string,
): Record<string, unknown> {
  const acc: Record<string, unknown> = {};

  for (const key in fields) {
    if (Object.hasOwn(fields, key)) {
      const value = fields[key];
      const name = prefix ? `${prefix}${capitalizeFirstLetter(key)}` : key;
      if (value instanceof Date) {
        acc[name] = value.toISOString();
      } else if (value instanceof Buffer) {
        // Convert file to base85
        acc[name] = fileToBase85(value);
      } else {
        acc[name] = value;
      }
    }
  }

  return acc;
}

export function convertBuilderObject(
  object: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  const acc: Record<string, unknown> = {};

  for (const key in object) {
    if (Object.hasOwn(object, key)) {
      const value = object[key];
      Object.assign(acc, convertValues(value, key === "root" ? undefined : key));
    }
  }

  return acc;
}
