import * as z from "zod";

import {
  CredentialApproximateNetWorthSchema,
  CredentialExpectedMonthlyTransactionCountSchema,
  CredentialExpectedMonthlyTransactionVolumeSchema,
  CredentialKycEmploymentStatusSchema,
  CredentialOccupationSchema,
  CredentialSourceOfWealthSchema,
  CredentialYearlyGrossIncomeSchema,
  GenderSchema,
  IDDocumentTypeSchema,
} from "./entities/enums";

export * from "./entities/enums";

export type idOSCredential = {
  id: string;
  user_id: string;
  public_notes: string;
  content: string;
  encryptor_public_key: string;
  issuer_auth_public_key: string;
  original_id?: string | null;
};

export type InsertableIDOSCredential = Omit<idOSCredential, "id" | "original_id"> & {
  id?: idOSCredential["id"];
  content_hash?: string;
  public_notes_signature: string;
  broader_signature: string;
};

// @context = "idos-credentials-v1.json"
// https://github.com/colinhacks/zod/issues/3751
export const CredentialFieldsSchema: z.ZodObject<{
  id: z.ZodString;
  level: z.ZodString;
  kycLevel: z.ZodNumber;
  issued: z.ZodOptional<z.ZodDate>;
  approvedAt: z.ZodOptional<z.ZodDate>;
  expirationDate: z.ZodOptional<z.ZodDate>;
}> = z.object({
  id: z.string(),

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: z.string(),

  /* Level of KYC verification performed (e.g., 1, 2, 3). */
  kycLevel: z.number(),

  /* @default Date.now() */
  issued: z.date().optional(),

  /* Date the credential was approved. */
  approvedAt: z.date().optional(),

  /* Date the credential was revoked. */
  expirationDate: z.date().optional(),
});

export type CredentialFields = z.infer<typeof CredentialFieldsSchema>;

// https://github.com/colinhacks/zod/issues/3751
export const CredentialSubjectSchema: z.ZodObject<{
  id: z.ZodString;
  // Indonesian and Indian did not always have first name
  firstName: z.ZodOptional<z.ZodString>;
  middleName: z.ZodOptional<z.ZodString>;
  ssn: z.ZodOptional<z.ZodString>;
  gender: z.ZodOptional<typeof GenderSchema>;
  nationality: z.ZodOptional<z.ZodString>;
  // Indonesian and Indian did not always have family name
  familyName: z.ZodOptional<z.ZodString>;
  maidenName: z.ZodOptional<z.ZodString>;
  email: z.ZodOptional<z.ZodEmail>;
  phoneNumber: z.ZodOptional<z.ZodString>;
  dateOfBirth: z.ZodDate;
  placeOfBirth: z.ZodOptional<z.ZodString>;
  selfieFile: z.ZodType<Buffer<ArrayBufferLike>>;
  residentialAddress: z.ZodOptional<typeof CredentialResidentialAddressSchema>;
}> = z
  .object({
    /* ID(unique credential)	Unique identifier for the credential itself. */
    id: z.string(),

    /* First name. */
    firstName: z.string().optional(),

    /* Middle name. */
    middleName: z.string().optional(),

    /* Social-security-number (without dashes) */
    ssn: z.string().min(9).max(9).optional(),

    /* Nationality (ISO 3166-1 alpha-2). */
    nationality: z.string().min(2).max(2).optional(),

    /* Gender (M or F, empty if not provided). */
    gender: GenderSchema.optional(),

    /* Family name. */
    familyName: z.string().optional(),

    /* Maiden name. */
    maidenName: z.string().optional(),

    /* Date of birth. */
    dateOfBirth: z.date(),

    /* Place of birth. */
    placeOfBirth: z.string().optional(),

    /* Email. */
    email: z.email().optional(),

    /* Phone number. */
    phoneNumber: z.string().optional(),

    /* Country that issued the identity document (ISO 3166-1 alpha-2). */
    idDocumentCountry: z.string().min(2).max(2),

    /* ID Document Number	Unique number on the identity document. */
    idDocumentNumber: z.string(),

    /* ID Document Type	Type of identity document(e.g., Passport, Driver's License, National ID). */
    idDocumentType: IDDocumentTypeSchema,

    /* ID Document Date of Issue	Date the identity document was issued. */
    idDocumentDateOfIssue: z.date().optional(),

    /* ID Document Date of Expiry	Expiration date of the identity document - if applicable. */
    idDocumentDateOfExpiry: z.date().optional(),

    /* ID Document Front File	Buffer with file representing the front of the identity document. */
    idDocumentFrontFile: z.instanceof(Buffer),

    /* ID Document Back File	Buffer with file representing the back of the identity document - if applicable. */
    idDocumentBackFile: z.instanceof(Buffer).optional(),

    /* (ID Document) Selfie File	Buffer with selfie with the identity document for verification purposes. */
    selfieFile: z.instanceof(Buffer),

    /* Residential Address Full residential address of the individual - if applicable. */
    residentialAddress: CredentialResidentialAddressSchema.optional(),
  })
  .refine(
    // At least one of firstName or familyName must be present,
    (data) => data.firstName || data.familyName,
    { message: "At least one of firstName or familyName must be provided" },
  );

export type CredentialSubject = z.infer<typeof CredentialSubjectSchema>;

export interface VerifiableCredentialSubject extends Omit<
  CredentialSubject,
  | "residentialAddress"
  | "idDocumentBackFile"
  | "idDocumentFrontFile"
  | "selfieFile"
  | "idDocumentDateOfIssue"
  | "idDocumentDateOfExpiry"
  | "dateOfBirth"
> {
  "@context": string;
  // Files are strings in verifiable credentials, but as an input they should be buffers
  idDocumentFrontFile?: string;
  idDocumentBackFile?: string;
  selfieFile?: string;
  // Dates are strings in verifiable credentials
  dateOfBirth?: string;
  idDocumentDateOfIssue?: string;
  idDocumentDateOfExpiry?: string;
  // This is the residential address flattened fields
  residentialAddressStreet?: string;
  residentialAddressHouseNumber?: string;
  residentialAddressAdditionalAddressInfo?: string;
  residentialAddressRegion?: string;
  residentialAddressCity?: string;
  residentialAddressPostalCode?: string;
  residentialAddressCountry?: string;
  residentialAddressProofCategory?: string;
  // Dates are strings in verifiable credentials
  residentialAddressProofDateOfIssue?: string;
  // Files are strings in verifiable credentials, but as an input they should be buffers
  residentialAddressProofFile?: string;
}

// TODO: This is a stub of the types for @digitalbazaar/vc
// when they introduce TypeScript support we should remove this
// The copy is here because `types.d.ts` file is not bundled.
export interface VerifiedCredentialsProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofValue: string;
  proofPurpose: string;
}

export const CredentialSubjectFaceIdSchema: z.ZodObject<{
  faceSignUserId: z.ZodString;
}> = z.object({
  faceSignUserId: z.string(),
});

export type CredentialSubjectFaceId = z.infer<typeof CredentialSubjectFaceIdSchema>;

export interface VerifiedCredentials<K> {
  "@context": string[];
  type: string[];
  issuer: string;
  id: string;
  level: string;
  issued: string;
  approvedAt: string;
  expirationDate: string;
  credentialSubject: K;
  issuanceDate: string;
  proof: VerifiedCredentialsProof;
}

export type VerifiableCredential<K> = VerifiedCredentials<K>;
