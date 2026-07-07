import { z } from "zod";

import { IDDocumentTypeSchema } from "./enums";

// https://github.com/colinhacks/zod/issues/3751
export const CredentialSubjectIdDocumentSchema: z.ZodObject<{
  type: typeof IDDocumentTypeSchema;
  number: z.ZodString;
  country: z.ZodString;
  dateOfIssue: z.ZodOptional<z.ZodDate>;
  dateOfExpiry: z.ZodOptional<z.ZodDate>;
  issuingAuthority: z.ZodOptional<z.ZodString>;
  frontFile: z.ZodType<Buffer<ArrayBufferLike>>;
  backFile: z.ZodOptional<z.ZodType<Buffer<ArrayBufferLike>>>;
  title: z.ZodOptional<z.ZodString>;
  mrzLine1: z.ZodOptional<z.ZodString>;
  extendedValidUntil: z.ZodOptional<z.ZodDate>;
  additionalNumber: z.ZodOptional<z.ZodString>;
  ethnicity: z.ZodOptional<z.ZodString>;
  issuingSubdivision: z.ZodOptional<z.ZodString>;
}> = z.object({
  /* The type of identity document used for verification (e.g. PASSPORT, ID_CARD, DRIVERS_LICENSE). */
  type: IDDocumentTypeSchema,

  /* The unique number on the identity document (e.g. passport number, ID card number). */
  number: z.string().min(1).max(255),

  /* The country of issuance of the identity document (e.g. USA, UK, Germany). */
  country: z.string().min(2).max(2),

  /* The date the identity document expires or ceases to be valid (YYYY-MM-DD). */
  dateOfExpiry: z.date().optional(),

  /* The date the identity document was issued (YYYY-MM-DD). */
  dateOfIssue: z.date().optional(),

  /* The name or code of the authority that issued the identity document (e.g. DVLA for UK driving licences, Bundesdruck­erei for German ID cards). */
  issuingAuthority: z.string().min(1).max(255).optional(),

  /* The file containing the identity document (e.g. passport photo, ID card photo). */
  frontFile: z.instanceof(Buffer),

  /* The file containing the identity document (e.g. passport photo, ID card photo). */
  backFile: z.instanceof(Buffer).optional(),

  /* The Machine-Readable Zone (MRZ) line(s) from the bottom of the identity document — encodes key identity data in a standardised scannable format. Includes mrzLine2 and mrzLine3. */
  mrzLine1: z.string().min(1).max(255).optional(),

  /* A title or honorific on the identity document (e.g. Dr, Mr, Ms, Prof). */
  title: z.string().min(1).max(255).optional(),

  /* An extended or renewed expiry date when a document's validity has been officially extended beyond its original expiry. */
  extendedValidUntil: z.date().optional(),

  /* A secondary personal identification number on the document (e.g. DNI in Spain, CRP in Brazil) — different from the document number itself. */
  additionalNumber: z.string().min(1).max(255).optional(),

  /* The person's ethnicity as indicated on the identity document — only present on some national documents. */
  ethnicity: z.string().min(1).max(255).optional(),

  /* The state or province that issued the identity document — relevant for jurisdictions where sub-national authorities issue IDs (e.g. US state driver's licences). */
  issuingSubdivision: z.string().min(1).max(255).optional(),
});

export type CredentialSubjectIdDocument = z.infer<typeof CredentialSubjectIdDocumentSchema>;
