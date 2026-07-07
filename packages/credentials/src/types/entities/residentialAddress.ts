import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const CredentialResidentialAddressSchema: z.ZodObject<{
  street: z.ZodString;
  houseNumber: z.ZodOptional<z.ZodString>;
  additionalAddressInfo: z.ZodOptional<z.ZodString>;
  region: z.ZodOptional<z.ZodString>;
  city: z.ZodString;
  postalCode: z.ZodOptional<z.ZodString>;
  country: z.ZodString;
  proofCategory: z.ZodString;
  proofDateOfIssue: z.ZodOptional<z.ZodDate>;
  proofFile: z.ZodType<Buffer<ArrayBufferLike>>;
  ipCountry: z.ZodOptional<z.ZodString>;
}> = z.object({
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
  proofCategory: z.string(),

  /* Residential Address Proof Date Of Issue	Date the address proof document was issued. */
  proofDateOfIssue: z.date().optional(),

  /* Residential Address Proof File or URL of the document provided as address proof. */
  proofFile: z.instanceof(Buffer),

  /* Country code derived from the IP address used when the applicant registered in Sumsub — indicates where they were located. */
  ipCountry: z.string().min(2).max(2).optional(),
});

export type CredentialResidentialAddress = z.infer<typeof CredentialResidentialAddressSchema>;
