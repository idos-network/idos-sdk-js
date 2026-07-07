import { z } from "zod";

import { OccupationSchema } from "./enums";

// https://github.com/colinhacks/zod/issues/3751
export const EDDSchema: z.ZodObject<{
  occupation: z.ZodOptional<typeof OccupationSchema>;
  sourceOfFundsProof: z.ZodOptional<z.ZodType<Buffer>>;
}> = z.object({
  /* The person's occupation or job title. */
  occupation: OccupationSchema.optional(),

  /* A file containing proof of the person's source of funds (e.g. bank statement, salary slip, investment statement). */
  sourceOfFundsProof: z.instanceof(Buffer).optional(),
});

export type EDD = z.infer<typeof EDDSchema>;
