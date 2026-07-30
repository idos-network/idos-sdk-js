import { z } from "zod";

import { IsoDate } from "../../codecs";

// https://github.com/colinhacks/zod/issues/3751
export const StructuredSchema: z.ZodObject<{
  id: z.ZodString;
  level: z.ZodString;
  approvedAt: z.ZodOptional<typeof IsoDate>;
}> = z.object({
  id: z.string(),

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: z.string(),

  /* Date the credential was approved. */
  approvedAt: IsoDate.optional(),
});

export type StructuredObject = z.infer<typeof StructuredSchema>;
