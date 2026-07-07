import { z } from "zod";

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
