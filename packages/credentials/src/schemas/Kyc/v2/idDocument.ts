import { z } from "zod";

import { Base85File, IsoDate } from "../../codecs";

// https://github.com/colinhacks/zod/issues/3751
export const IdDocumentSchema: z.ZodObject<{
  country: z.ZodOptional<z.ZodString>;
  number: z.ZodOptional<z.ZodString>;
  type: z.ZodOptional<z.ZodString>;
  dateOfIssue: z.ZodOptional<typeof IsoDate>;
  dateOfExpiry: z.ZodOptional<typeof IsoDate>;
  frontFile: z.ZodOptional<typeof Base85File>;
  backFile: z.ZodOptional<typeof Base85File>;
}> = z.object({
  country: z.string().min(2).max(2).optional(),
  number: z.string().optional(),
  type: z.string().optional(),
  dateOfIssue: IsoDate.optional(),
  dateOfExpiry: IsoDate.optional(),
  frontFile: Base85File.optional(),
  backFile: Base85File.optional(),
});

export type IdDocument = z.infer<typeof IdDocumentSchema>;
