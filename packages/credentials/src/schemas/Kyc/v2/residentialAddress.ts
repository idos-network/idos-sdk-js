import { z } from "zod";

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
  proofDateOfIssue: z.ZodOptional<z.ZodDate>;
  proofFile: z.ZodOptional<z.ZodType<Buffer<ArrayBufferLike>>>;
}> = z.object({
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  additionalAddressInfo: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2).max(2).optional(),
  proofCategory: z.string().optional(),
  proofDateOfIssue: z.date().optional(),
  proofFile: z.instanceof(Buffer).optional(),
});

export type ResidentialAddress = z.infer<typeof ResidentialAddressSchema>;
