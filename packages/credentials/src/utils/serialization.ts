export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/*
 * Flattening is a pure rename: values arrive already encoded, because the schemas
 * declare their wire representation with a codec (see `schemas/codecs.ts`) and the
 * container runs `z.encode` before flattening. Nothing here inspects value types.
 */
export function convertValues<K extends Record<string, unknown>>(
  fields: K,
  prefix?: string,
): Record<string, unknown> {
  const acc: Record<string, unknown> = {};

  for (const key in fields) {
    if (Object.hasOwn(fields, key)) {
      acc[prefix ? `${prefix}${capitalizeFirstLetter(key)}` : key] = fields[key];
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
