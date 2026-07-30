import { z } from "zod";

import { Base85File, IsoDate } from "../../codecs";

// https://github.com/colinhacks/zod/issues/3751
export const ResidentialAddressSchema: z.ZodObject<{
  street: z.ZodOptional<z.ZodString>;
  houseNumber: z.ZodOptional<z.ZodString>;
  additionalAddressInfo: z.ZodOptional<z.ZodString>;
  region: z.ZodOptional<z.ZodString>;
  city: z.ZodOptional<z.ZodString>;
  postalCode: z.ZodOptional<z.ZodString>;
  country: z.ZodOptional<z.ZodString>;
  proofCategory: z.ZodOptional<z.ZodString>;
  proofDateOfIssue: z.ZodOptional<typeof IsoDate>;
  proofFile: z.ZodOptional<typeof Base85File>;
}> = z.object({
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  additionalAddressInfo: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2).max(2).optional(),
  proofCategory: z.string().optional(),
  proofDateOfIssue: IsoDate.optional(),
  proofFile: Base85File.optional(),
});

export type ResidentialAddress = z.infer<typeof ResidentialAddressSchema>;
