import { z } from "zod";

/**
 * The wire representation of a structured value: `Date` and `Buffer` are carried
 * as strings (ISO 8601 and base85 respectively) once serialized.
 */
type Wire<T> = T extends Date ? string : T extends Buffer ? string : T;

/** `root` fields keep their name; every other section prefixes: `person` + `firstName` -> `personFirstName`. */
type PrefixedKey<Section extends string, Key> = Section extends "root"
  ? Key & string
  : `${Section}${Capitalize<Key & string>}`;

/**
 * Maps over `keyof S` rather than `keyof S & string` on purpose: the intersection
 * makes the mapped type non-homomorphic, which silently drops `?` modifiers.
 */
type FlattenSection<Section extends string, S> = {
  [K in keyof S as PrefixedKey<Section, K>]: Wire<S[K]>;
};

/** A field of an optional section is itself optional on the flat object. */
type PartialSection<S> = { [K in keyof S]?: S[K] };

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type FlattenSections<T> = UnionToIntersection<
  {
    [Section in keyof T & string]: undefined extends T[Section]
      ? PartialSection<FlattenSection<Section, NonNullable<T[Section]>>>
      : FlattenSection<Section, NonNullable<T[Section]>>;
  }[keyof T & string]
>;

/**
 * The flat credential subject derived from a structured subject type — the shape
 * `serializeSubject()` emits and `deserialize()` accepts.
 *
 * Replaces the previously code-generated `src/generated/*` flat schemas; the
 * assertions keeping this aligned live in `schemas/utils.test.ts`.
 */
export type FlatSubject<T> = { [K in keyof FlattenSections<T>]: FlattenSections<T>[K] };

export function unwrapSectionSchema(schema: z.ZodTypeAny): z.ZodObject<z.ZodRawShape> {
  const unwrapped = schema instanceof z.ZodOptional ? schema.unwrap() : schema;
  if (!(unwrapped instanceof z.ZodObject)) {
    throw new Error("Expected section schema to be a Zod object");
  }

  return unwrapped;
}

export function sectionSchemas<T extends z.ZodObject<z.ZodRawShape>>(
  structuredSchema: T,
): Record<keyof T["shape"], z.ZodObject<z.ZodRawShape>> {
  return Object.fromEntries(
    Object.entries(structuredSchema.shape).map(([section, schema]) => [
      section,
      unwrapSectionSchema(schema as z.ZodTypeAny),
    ]),
  ) as Record<keyof T["shape"], z.ZodObject<z.ZodRawShape>>;
}

export function sectionFields(
  schemas: Record<string, z.ZodObject<z.ZodRawShape>>,
): Record<string, Set<string>> {
  return Object.fromEntries(
    Object.entries(schemas).map(([section, schema]) => [
      section,
      new Set(Object.keys(schema.shape)),
    ]),
  ) as Record<string, Set<string>>;
}

export function deriveSectionMaps<T extends z.ZodObject<z.ZodRawShape>>(
  structuredSchema: T,
): {
  schemas: Record<keyof T["shape"], z.ZodObject<z.ZodRawShape>>;
  fields: Record<keyof T["shape"], Set<string>>;
} {
  const schemas = sectionSchemas(structuredSchema);
  const fields = sectionFields(schemas) as Record<keyof T["shape"], Set<string>>;

  return { schemas, fields };
}
