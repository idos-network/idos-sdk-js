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

const mapping: Record<string, z.ZodObject<any>> = {
  root: RootSchema,
  person: PersonSchema,
  contact: ContactSchema,
  biometric: BiometricSchema,
  idDocument: IdDocumentSchema,
  residentialAddress: ResidentialAddressSchema,
  screening: ScreeningSchema,
  edd: EDDSchema,
  sourceOfWealth: SourceOfWealthSchema,
};

export const BuilderSchema: z.ZodObject<{
  root: typeof RootSchema;
  person: typeof PersonSchema;
  contact: z.ZodOptional<typeof ContactSchema>;
  biometric: z.ZodOptional<typeof BiometricSchema>;
  idDocument: z.ZodOptional<typeof IdDocumentSchema>;
  residentialAddress: z.ZodOptional<typeof ResidentialAddressSchema>;
  screening: z.ZodOptional<typeof ScreeningSchema>;
  edd: z.ZodOptional<typeof EDDSchema>;
  sourceOfWealth: z.ZodOptional<typeof SourceOfWealthSchema>;
}> = z.object({
  root: RootSchema,
  person: PersonSchema,
  contact: ContactSchema.optional(),
  biometric: BiometricSchema.optional(),
  idDocument: IdDocumentSchema.optional(),
  residentialAddress: ResidentialAddressSchema.optional(),
  screening: ScreeningSchema.optional(),
  edd: EDDSchema.optional(),
  sourceOfWealth: SourceOfWealthSchema.optional(),
});

export type BuilderType = z.infer<typeof BuilderSchema>;

export default mapping;
