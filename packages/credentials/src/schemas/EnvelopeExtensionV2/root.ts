import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const RootSchema: z.ZodObject<{
  id: z.ZodString;
  level: z.ZodString;
  kycLevel: z.ZodNumber;
  issued: z.ZodOptional<z.ZodISODateTime>;
  approvedAt: z.ZodOptional<z.ZodISODateTime>;
  expirationDate: z.ZodOptional<z.ZodISODateTime>;
}> = z.object({
  id: z.string(),

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: z.string(),

  /* Level of KYC verification performed (e.g., 1, 2, 3). */
  kycLevel: z.number().int().positive(),

  /* @default Date.now() */
  issued: z.iso.datetime().optional(),

  /* Date the credential was approved. */
  approvedAt: z.iso.datetime().optional(),

  /* Date the credential was revoked. */
  expirationDate: z.iso.datetime().optional(),
});

export type Root = z.infer<typeof RootSchema>;
