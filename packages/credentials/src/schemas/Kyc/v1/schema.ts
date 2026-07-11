import { z } from "zod";

import { IdDocumentSchema } from "./idDocument";
import { ResidentialAddressSchema } from "./residentialAddress";
import { RootSchema } from "./root";

export const StructuredSchema: z.ZodObject<{
  root: typeof RootSchema;
  idDocument: z.ZodOptional<typeof IdDocumentSchema>;
  residentialAddress: z.ZodOptional<typeof ResidentialAddressSchema>;
}> = z.object({
  root: RootSchema,
  idDocument: IdDocumentSchema.optional(),
  residentialAddress: ResidentialAddressSchema.optional(),
});

export type StructuredObject = z.infer<typeof StructuredSchema>;
