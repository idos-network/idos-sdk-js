import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const ResidentialAddressSchema: z.ZodObject<{
  verified: z.ZodBoolean;
  street: z.ZodString;
  houseNumber: z.ZodOptional<z.ZodString>;
  additionalAddressInfo: z.ZodOptional<z.ZodString>;
  region: z.ZodOptional<z.ZodString>;
  city: z.ZodString;
  postalCode: z.ZodOptional<z.ZodString>;
  country: z.ZodString;
  proofCategory: z.ZodOptional<z.ZodString>;
  proofDateOfIssue: z.ZodOptional<z.ZodDate>;
  proofFile: z.ZodOptional<z.ZodType<Buffer<ArrayBufferLike>>>;
  ipCountry: z.ZodOptional<z.ZodString>;
}> = z
  .object({
    // TODO: Check with marjorie
    /** Whether the residential address has been verified against the proof document. */
    /** If false, the address has been manually entered by the user. */
    verified: z.boolean(),

    /* Street address. */
    street: z.string(),

    /* House number. */
    houseNumber: z.string().optional(),

    /* Additional address information (e.g., apartment number). */
    additionalAddressInfo: z.string().optional(),

    /* Region (e.g., state, province). */
    region: z.string().optional(),

    /* Locality (e.g., city, town). */
    city: z.string(),

    /* Postal code. */
    postalCode: z.string().optional(),

    /* Country (ISO 3166-1 alpha-2). */
    country: z.string().min(2).max(2),

    /* Residential Address Proof Category	Type of document provided to verify the address(e.g., utility bill, bank statement). */
    proofCategory: z.string().optional(),

    /* Residential Address Proof Date Of Issue	Date the address proof document was issued. */
    proofDateOfIssue: z.date().optional(),

    /* Residential Address Proof File or URL of the document provided as address proof. */
    proofFile: z.instanceof(Buffer).optional(),

    /* Country code derived from the IP address used when the applicant registered in Sumsub — indicates where they were located. */
    ipCountry: z.string().min(2).max(2).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.verified && !data.proofFile) {
      ctx.addIssue({
        code: "custom",
        path: ["proofFile"],
        message: "Proof file must be provided if verified is true",
      });
    }

    if (data.verified && !data.proofCategory) {
      ctx.addIssue({
        code: "custom",
        path: ["proofCategory"],
        message: "Proof category must be provided if verified is true",
      });
    }
  });

export type ResidentialAddress = z.infer<typeof ResidentialAddressSchema>;
