import { z } from "zod";

import { BiometricSchema } from "./biometric";
import { ContactSchema } from "./contact";
import { EDDSchema } from "./edd";
import { IdDocumentSchema } from "./idDocument";
import { PersonSchema } from "./person";
import { ResidentialAddressSchema } from "./residentialAddress";
import { RootSchema } from "./root";
import { ScreeningSchema } from "./screening";
import { SourceOfWealthSchema } from "./sourceOfWealth";

export const StructuredSchema: z.ZodObject<{
  root: typeof RootSchema;
  person: typeof PersonSchema;
  idDocument: typeof IdDocumentSchema;
  contact: z.ZodOptional<typeof ContactSchema>;
  biometric: z.ZodOptional<typeof BiometricSchema>;
  residentialAddress: z.ZodOptional<typeof ResidentialAddressSchema>;
  screening: z.ZodOptional<typeof ScreeningSchema>;
  edd: z.ZodOptional<typeof EDDSchema>;
  sourceOfWealth: z.ZodOptional<typeof SourceOfWealthSchema>;
}> = z.object({
  root: RootSchema,
  person: PersonSchema,
  idDocument: IdDocumentSchema,
  contact: ContactSchema.optional(),
  biometric: BiometricSchema.optional(),
  residentialAddress: ResidentialAddressSchema.optional(),
  screening: ScreeningSchema.optional(),
  edd: EDDSchema.optional(),
  sourceOfWealth: SourceOfWealthSchema.optional(),
});

export type StructuredObject = z.infer<typeof StructuredSchema>;
