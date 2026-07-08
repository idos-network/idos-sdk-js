import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const ContactSchema: z.ZodObject<{
  email: z.ZodOptional<z.ZodEmail>;
  phoneNumber: z.ZodOptional<z.ZodString>;
}> = z.object({
  /* The person's email address. */
  email: z.email().optional(),

  /* The person's phone number. */
  phoneNumber: z.string().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;
