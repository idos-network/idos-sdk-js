import { z } from "zod";

import {
  EmploymentStatusSchema,
  ExpectedMonthlyTransactionCountSchema,
  ExpectedMonthlyTransactionVolumeSchema,
} from "./enums";

// https://github.com/colinhacks/zod/issues/3751
export const OnboardingSchema: z.ZodObject<{
  employmentStatus: typeof EmploymentStatusSchema;
  expectedMonthlyTransactionCount: typeof ExpectedMonthlyTransactionCountSchema;
  expectedMonthlyTransactionVolume: typeof ExpectedMonthlyTransactionVolumeSchema;
}> = z.object({
  /* The person's employment status (e.g. employed, self-employed, unemployed, retired). */
  employmentStatus: EmploymentStatusSchema,

  /* The person's expected monthly transaction count (e.g. less than 5, between 5 and 10, more than 10). */
  expectedMonthlyTransactionCount: ExpectedMonthlyTransactionCountSchema,

  /* The person's expected monthly transaction volume (e.g. less than 500, between 500 and 2000, more than 2000). */
  expectedMonthlyTransactionVolume: ExpectedMonthlyTransactionVolumeSchema,
});

export type Onboarding = z.infer<typeof OnboardingSchema>;
