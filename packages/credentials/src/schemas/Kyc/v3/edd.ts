import { z } from "zod";

import { OccupationSchema } from "./enums";

// https://github.com/colinhacks/zod/issues/3751
export const EDDSchema: z.ZodObject<{
  occupation: z.ZodOptional<typeof OccupationSchema>;
  sourceOfFundsCategory: z.ZodOptional<z.ZodString>;
  sourceOfFundsProofFile: z.ZodOptional<z.ZodType<Buffer<ArrayBufferLike>>>;
}> = z.object({
  /* The person's occupation or job title. */
  occupation: OccupationSchema.optional(),

  /* The category of the person's source of funds — the origin of money used in transactions (e.g. salary, business income, savings). */
  sourceOfFundsCategory: z.string().optional(),

  /* A file containing proof of the person's source of funds (e.g. bank statement, salary slip, investment statement). */
  sourceOfFundsProofFile: z.instanceof(Buffer).optional(),
});

export type EDD = z.infer<typeof EDDSchema>;
