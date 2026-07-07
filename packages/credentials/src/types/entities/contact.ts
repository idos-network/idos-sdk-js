import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const CredentialSubjectContactSchema: z.ZodObject<{
  email: z.ZodOptional<z.ZodEmail>;
  phoneNumber: z.ZodOptional<z.ZodString>;
}> = z.object({
  /* The person's email address. */
  email: z.email().optional(),

  /* The person's phone number. */
  phoneNumber: z.string().optional(),
});

export type CredentialSubjectContact = z.infer<typeof CredentialSubjectContactSchema>;
