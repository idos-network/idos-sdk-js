import { z } from "zod";

import { ScreeningResultSchema } from "./enums";

// https://github.com/colinhacks/zod/issues/3751
export const ScreeningSchema: z.ZodObject<{
  sanctionsCheckResult: typeof ScreeningResultSchema;
  sanctionsConfidenceScore: z.ZodOptional<z.ZodNumber>;
  pepCheckResult: typeof ScreeningResultSchema;
  pepConfidenceScore: z.ZodOptional<z.ZodNumber>;
}> = z.object({
  /* The result of the sanctions screening check — whether the person appears on any sanctions lists (e.g. CLEAR, HIT). */
  sanctionsCheckResult: ScreeningResultSchema,

  /* A confidence score (0–100) for the sanctions screening result — indicates how certain the match is. */
  sanctionsConfidenceScore: z.number().min(0).max(100).optional(),

  /* The result of the PEP (Politically Exposed Person) screening check (e.g. CLEAR, HIT). */
  pepCheckResult: ScreeningResultSchema,

  /* A confidence score (0–100) for the PEP screening result — indicates how certain the match is. */
  pepConfidenceScore: z.number().min(0).max(100).optional(),
});

export type Screening = z.infer<typeof ScreeningSchema>;
