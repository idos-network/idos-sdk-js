import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const IdDocumentSchema: z.ZodObject<{
  country: z.ZodOptional<z.ZodString>;
  number: z.ZodOptional<z.ZodString>;
  type: z.ZodOptional<z.ZodString>;
  dateOfIssue: z.ZodOptional<z.ZodDate>;
  dateOfExpiry: z.ZodOptional<z.ZodDate>;
  frontFile: z.ZodOptional<z.ZodType<Buffer<ArrayBufferLike>>>;
  backFile: z.ZodOptional<z.ZodType<Buffer<ArrayBufferLike>>>;
}> = z.object({
  country: z.string().min(2).max(2).optional(),
  number: z.string().optional(),
  type: z.string().optional(),
  dateOfIssue: z.date().optional(),
  dateOfExpiry: z.date().optional(),
  frontFile: z.instanceof(Buffer).optional(),
  backFile: z.instanceof(Buffer).optional(),
});

export type IdDocument = z.infer<typeof IdDocumentSchema>;
