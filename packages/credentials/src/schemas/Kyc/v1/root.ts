import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const RootSchema: z.ZodObject<{
  id: z.ZodString;
  applicantId: z.ZodOptional<z.ZodString>;
  inquiryId: z.ZodOptional<z.ZodString>;
  firstName: z.ZodOptional<z.ZodString>;
  middleName: z.ZodOptional<z.ZodString>;
  nationality: z.ZodOptional<z.ZodString>;
  familyName: z.ZodOptional<z.ZodString>;
  maidenName: z.ZodOptional<z.ZodString>;
  gender: z.ZodOptional<z.ZodString>;
  governmentId: z.ZodOptional<z.ZodString>;
  governmentIdType: z.ZodOptional<z.ZodString>;
  email: z.ZodOptional<z.ZodEmail>;
  ssn: z.ZodOptional<z.ZodString>;
  phoneNumber: z.ZodOptional<z.ZodString>;
  dateOfBirth: z.ZodOptional<z.ZodDate>;
  placeOfBirth: z.ZodOptional<z.ZodString>;
  selfieFile: z.ZodOptional<z.ZodType<Buffer<ArrayBufferLike>>>;
}> = z.object({
  id: z.string(),
  applicantId: z.string().optional(),
  inquiryId: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  nationality: z.string().min(2).max(2).optional(),
  familyName: z.string().optional(),
  maidenName: z.string().optional(),
  gender: z.string().optional(),
  governmentId: z.string().optional(),
  governmentIdType: z.string().optional(),
  email: z.email().optional(),
  ssn: z.string().optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.date().optional(),
  placeOfBirth: z.string().optional(),
  selfieFile: z.instanceof(Buffer).optional(),
});

export type Root = z.infer<typeof RootSchema>;
