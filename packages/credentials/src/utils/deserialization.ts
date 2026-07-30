import { z } from "zod";

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

/*
 * Both directions are a pure reshape followed by `z.decode`: the schemas declare which
 * fields cross the wire as ISO strings or base85 (see `schemas/codecs.ts`), so decoding
 * produces the `Date`/`Buffer` values without anything here inspecting field types.
 * Unknown flat keys are dropped, so envelope extras like `proof` do not reach the schema.
 */
export function flatObjectToStructured<T>(
  flatObject: Record<string, unknown>,
  schema: z.ZodSchema<T>,
): T {
  const structured: Record<string, unknown> = {};

  for (const key of Object.keys(getObjectShape(schema))) {
    if (Object.hasOwn(flatObject, key)) {
      structured[key] = flatObject[key];
    }
  }

  return z.decode(schema, structured);
}

export function flatSubjectToStructured<T>(
  flatSubject: Record<string, unknown>,
  schema: z.ZodSchema<T>,
): T {
  const structured: Record<string, Record<string, unknown>> = {};

  for (const [sectionKey, sectionSchema] of Object.entries(getObjectShape(schema))) {
    const section: Record<string, unknown> = {};

    for (const fieldKey of Object.keys(getObjectShape(sectionSchema))) {
      const flatKey =
        sectionKey === "root" ? fieldKey : `${sectionKey}${capitalizeFirstLetter(fieldKey)}`;

      if (Object.hasOwn(flatSubject, flatKey)) {
        section[fieldKey] = flatSubject[flatKey];
      }
    }

    if (Object.keys(section).length > 0) {
      structured[sectionKey] = section;
    }
  }

  return z.decode(schema, structured);
}
