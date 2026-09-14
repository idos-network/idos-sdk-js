import { IsIn } from "class-validator";

import {
  Currencies,
  EmploymentStatuses,
  ExpectedMonthlyTransactionCounts,
  ExpectedMonthlyTransactionVolumes,
  IntendedUses,
  type Currency,
  type EmploymentStatus,
  type ExpectedMonthlyTransactionCount,
  type ExpectedMonthlyTransactionVolume,
  type IntendedUse,
} from "../enums";

export class Onboarding {
  /* Intended use of the credentials. */
  @IsIn(IntendedUses)
  intendedUse: IntendedUse;

  /* The person's employment status (e.g. EMPLOYED, RETIRED). */
  @IsIn(EmploymentStatuses)
  employmentStatus: EmploymentStatus;

  /* The person's expected monthly transaction count, as a band. */
  @IsIn(ExpectedMonthlyTransactionCounts)
  expectedMonthlyTransactionCount: ExpectedMonthlyTransactionCount;

  /* The person's expected monthly transaction volume, as a band. */
  @IsIn(ExpectedMonthlyTransactionVolumes)
  expectedMonthlyTransactionVolume: ExpectedMonthlyTransactionVolume;

  /* The currency of the person's expected monthly transaction volume. */
  @IsIn(Currencies)
  expectedMonthlyTransactionVolumeCurrency: Currency;
}
