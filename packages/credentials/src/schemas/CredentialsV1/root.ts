import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const RootSchema: z.ZodObject<{
  id: z.ZodString;
  level: z.ZodString;
  approvedAt: z.ZodOptional<z.ZodISODateTime>;
}> = z.object({
  id: z.string(),

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: z.string(),

  /* Date the credential was approved. */
  approvedAt: z.iso.datetime().optional(),
});

export type Root = z.infer<typeof RootSchema>;
