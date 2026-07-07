import { z } from "zod";

import {
  CurrencySchema,
  EmploymentStatusSchema,
  ExpectedMonthlyTransactionCountSchema,
  ExpectedMonthlyTransactionVolumeSchema,
  IntendedUseSchema,
} from "./enums";

// https://github.com/colinhacks/zod/issues/3751
export const OnboardingSchema: z.ZodObject<{
  intendedUse: typeof IntendedUseSchema;
  employmentStatus: typeof EmploymentStatusSchema;
  expectedMonthlyTransactionCount: typeof ExpectedMonthlyTransactionCountSchema;
  expectedMonthlyTransactionVolume: typeof ExpectedMonthlyTransactionVolumeSchema;
  expectedMonthlyTransactionVolumeCurrency: typeof CurrencySchema;
}> = z.object({
  /** Intended use of the credentials (TODO: This is weird...). */
  intendedUse: IntendedUseSchema,

  /* The person's employment status (e.g. employed, self-employed, unemployed, retired). */
  employmentStatus: EmploymentStatusSchema,

  /* The person's expected monthly transaction count (e.g. less than 5, between 5 and 10, more than 10). */
  expectedMonthlyTransactionCount: ExpectedMonthlyTransactionCountSchema,

  /* The person's expected monthly transaction volume (e.g. less than 500, between 500 and 2000, more than 2000). */
  expectedMonthlyTransactionVolume: ExpectedMonthlyTransactionVolumeSchema,

  /* The currency of the person's expected monthly transaction volume (e.g. EUR, USD, GBP, etc.). */
  expectedMonthlyTransactionVolumeCurrency: CurrencySchema,
});

export type Onboarding = z.infer<typeof OnboardingSchema>;
