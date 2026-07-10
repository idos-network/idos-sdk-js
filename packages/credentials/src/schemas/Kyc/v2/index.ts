import { z } from "zod";

import { IdDocumentSchema } from "./idDocument";
import { ResidentialAddressSchema } from "./residentialAddress";
import { RootSchema } from "./root";

const mapping: Record<string, z.ZodObject<any>> = {
  root: RootSchema,
  idDocument: IdDocumentSchema,
  residentialAddress: ResidentialAddressSchema,
};

export const BuilderSchema: z.ZodObject<{
  root: typeof RootSchema;
  idDocument: z.ZodOptional<typeof IdDocumentSchema>;
  residentialAddress: z.ZodOptional<typeof ResidentialAddressSchema>;
}> = z.object({
  root: RootSchema,
  idDocument: IdDocumentSchema.optional(),
  residentialAddress: ResidentialAddressSchema.optional(),
});

export type BuilderType = z.infer<typeof BuilderSchema>;

export default mapping;
