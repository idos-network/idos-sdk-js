import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const CredentialFieldsSchema: z.ZodObject<
  {
    id: z.ZodString;
    level: z.ZodString;
    issued: z.ZodOptional<z.ZodDate>;
    approvedAt: z.ZodOptional<z.ZodDate>;
    expirationDate: z.ZodOptional<z.ZodDate>;
  },
  "strip"
> = z.object({
  id: z.string(),

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: z.string(),

  /* @default Date.now() */
  issued: z.date().optional(),

  /* Date the credential was approved. */
  approvedAt: z.date().optional(),

  /* Date the credential was revoked. */
  expirationDate: z.date().optional(),
});

export type CredentialFields = z.infer<typeof CredentialFieldsSchema>;

// https://github.com/colinhacks/zod/issues/3751
export const CredentialResidentialAddressSchema: z.ZodObject<
  {
    street: z.ZodString;
    houseNumber: z.ZodOptional<z.ZodString>;
    additionalAddressInfo: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodString;
  },
  "strip"
> = z.object({
  /* Street address. */
  street: z.string(),

  /* House number. */
  houseNumber: z.string().optional(),

  /* Additional address information (e.g., apartment number). */
  additionalAddressInfo: z.string().optional(),

  /* Locality (e.g., city, town). */
  city: z.string(),

  /* Postal code. */
  postalCode: z.string(),

  /* Country (ISO 3166-1 alpha-2). */
  country: z.string().min(2).max(2),
});

export type CredentialResidentialAddress = z.infer<typeof CredentialFieldsSchema>;

export const IDDocumentTypeSchema: z.ZodEnum<["PASSPORT", "DRIVERS", "ID_CARD"]> = z.enum([
  "PASSPORT",
  "DRIVERS",
  "ID_CARD",
] as const);
export type IDDocumentType = z.infer<typeof IDDocumentTypeSchema>;

// https://github.com/colinhacks/zod/issues/3751
export const CredentialSubjectSchema: z.ZodObject<
  {
    id: z.ZodString;
    applicantId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    familyName: z.ZodString;
    maidenName: z.ZodOptional<z.ZodString>;
    governmentId: z.ZodOptional<z.ZodString>;
    governmentIdType: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodDate;
    placeOfBirth: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    idDocumentCountry: z.ZodString;
    idDocumentNumber: z.ZodString;
    idDocumentType: typeof IDDocumentTypeSchema;
    idDocumentDateOfIssue: z.ZodOptional<z.ZodDate>;
    idDocumentDateOfExpiry: z.ZodOptional<z.ZodDate>;
    idDocumentFrontFile: z.ZodType<Buffer<ArrayBufferLike>>;
    idDocumentBackFile: z.ZodOptional<z.ZodType<Buffer<ArrayBufferLike>>>;
    selfieFile: z.ZodType<Buffer<ArrayBufferLike>>;
    residentialAddress: z.ZodOptional<typeof CredentialResidentialAddressSchema>;
    residentialAddressProofCategory: z.ZodOptional<z.ZodString>;
    residentialAddressProofDateOfIssue: z.ZodOptional<z.ZodDate>;
    residentialAddressProofFile: z.ZodOptional<z.ZodType<Buffer<ArrayBufferLike>>>;
  },
  "strip"
> = z.object({
  /* ID(unique credential)	Unique identifier for the credential itself. */
  id: z.string(),

  /* Applicant ID. */
  applicantId: z.string().optional(),

  /* First name. */
  firstName: z.string(),

  /* Family name. */
  familyName: z.string(),

  /* Maiden name. */
  maidenName: z.string().optional(),

  /* Government ID. */
  governmentId: z.string().optional(),

  /* Government ID type. */
  governmentIdType: z.string().optional(),

  /* Date of birth. */
  dateOfBirth: z.date(),

  /* Place of birth. */
  placeOfBirth: z.string().optional(),

  /* Email. */
  email: z.string().email().optional(),

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

  /* Residential Address	Full residential address of the individual - if applicable. */
  residentialAddress: CredentialResidentialAddressSchema.optional(),

  /* Residential Address Proof Category	Type of document provided to verify the address(e.g., utility bill, bank statement). */
  residentialAddressProofCategory: z.string().optional(),

  /* Residential Address Proof Date Of Issue	Date the address proof document was issued. */
  residentialAddressProofDateOfIssue: z.date().optional(),

  /* Residential Address Proof File	File or URL of the document provided as address proof. */
  residentialAddressProofFile: z.instanceof(Buffer).optional(),
});

export type CredentialSubject = z.infer<typeof CredentialSubjectSchema>;

export interface VerifiableCredentialSubject extends Omit<CredentialSubject, "residentialAddress"> {
  "@context": string;
  residentialAddressStreet?: string;
  residentialAddressHouseNumber?: string;
  residentialAddressAdditionalAddressInfo?: string;
  residentialAddressCity?: string;
  residentialAddressPostalCode?: string;
  residentialAddressCountry?: string;
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
