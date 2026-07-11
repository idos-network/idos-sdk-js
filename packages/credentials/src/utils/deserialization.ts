import { z } from "zod";

import { base85ToFile } from "./serialization";
import { capitalizeFirstLetter } from "./serialization";

type AnyZodSchema = z.ZodType<unknown>;

function unwrapSchema(schema: AnyZodSchema): AnyZodSchema {
  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault
  ) {
    return unwrapSchema(schema.unwrap() as AnyZodSchema);
  }

  return schema;
}

function getObjectShape(schema: AnyZodSchema): Record<string, AnyZodSchema> {
  const unwrapped = unwrapSchema(schema);

  if (unwrapped instanceof z.ZodObject) {
    return unwrapped.shape as Record<string, AnyZodSchema>;
  }

  throw new Error("Expected a Zod object schema");
}

function isBufferSchema(schema: AnyZodSchema): boolean {
  return schema.safeParse(Buffer.alloc(0)).success && !schema.safeParse("").success;
}

function deserializeValue(value: unknown, schema: AnyZodSchema): unknown {
  if (value === undefined) {
    return value;
  }

  const unwrapped = unwrapSchema(schema);

  if (unwrapped instanceof z.ZodDate && typeof value === "string") {
    return new Date(value);
  }

  if (typeof value === "string" && isBufferSchema(unwrapped)) {
    const file = base85ToFile(value);
    return file === false ? value : file;
  }

  return value;
}

export function flatObjectToStructured<T>(
  flatObject: Record<string, unknown>,
  schema: z.ZodSchema<T>,
): T {
  const structured: Record<string, unknown> = {};

  for (const [key, fieldSchema] of Object.entries(getObjectShape(schema))) {
    if (Object.hasOwn(flatObject, key)) {
      structured[key] = deserializeValue(flatObject[key], fieldSchema);
    }
  }

  return schema.parse(structured);
}

export function flatSubjectToStructured<T>(
  flatSubject: Record<string, unknown>,
  schema: z.ZodSchema<T>,
): T {
  const structured: Record<string, Record<string, unknown>> = {};

  for (const [sectionKey, sectionSchema] of Object.entries(getObjectShape(schema))) {
    const section: Record<string, unknown> = {};

    for (const [fieldKey, fieldSchema] of Object.entries(getObjectShape(sectionSchema))) {
      const flatKey =
        sectionKey === "root" ? fieldKey : `${sectionKey}${capitalizeFirstLetter(fieldKey)}`;

      if (Object.hasOwn(flatSubject, flatKey)) {
        section[fieldKey] = deserializeValue(flatSubject[flatKey], fieldSchema);
      }
    }

    if (Object.keys(section).length > 0) {
      structured[sectionKey] = section;
    }
  }

  return schema.parse(structured);
}
