import { z } from "zod";

import {
  SourceOfWealthTypeSchema,
  YearlyGrossIncomeSchema,
  ApproximateNetWorthSchema,
} from "./enums";

// https://github.com/colinhacks/zod/issues/3751
export const SourceOfWealthSchema: z.ZodObject<{
  type: typeof SourceOfWealthTypeSchema;
  yearlyGrossIncome: typeof YearlyGrossIncomeSchema;
  approximateNetWorth: typeof ApproximateNetWorthSchema;
  sourceOfWealthProofFile: z.ZodType<Buffer<ArrayBufferLike>>;
}> = z.object({
  /* Categories/types of wealth sources declared by the person (e.g. employment, inheritance, investments). */
  type: SourceOfWealthTypeSchema,

  /* The person's yearly gross income (e.g. less than 20000, between 20001 and 30000, between 30001 and 40000, between 40001 and 50000, between 50001 and 60000, between 60001 and 70000, between 70001 and 80000, between 80001 and 90000, between 90001 and 100000, between 100001 and 110000, between 110001 and 120000, between 120001 and 130000, between 130001 and 140000, between 140001 and 150000, more than 150000, between 150001 and 200000, between 200001 and 500000, more than 500000). */
  yearlyGrossIncome: YearlyGrossIncomeSchema,

  /* The person's approximate net worth (e.g. up to 25000, between 25001 and 50000, between 50001 and 100000, between 100001 and 300000, between 300001 and 500000, between 500001 and 1000000, over 1000001). */
  approximateNetWorth: ApproximateNetWorthSchema,

  /* A file containing proof of the person's source of wealth (e.g. bank statement, salary slip, investment statement). */
  sourceOfWealthProofFile: z.instanceof(Buffer),
});

export type SourceOfWealth = z.infer<typeof SourceOfWealthSchema>;
