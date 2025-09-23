import * as z from "zod";

export type idOSCredential = {
  id: string;
  user_id: string;
  issuer_auth_public_key: string;
  original_id?: string;
  public_notes: string;
  content: string;
  encryptor_public_key: string;
};

export type InsertableIDOSCredential = Omit<idOSCredential, "id" | "original_id"> & {
  id?: idOSCredential["id"];
  content_hash?: string;
  public_notes_signature: string;
  broader_signature: string;
};

// https://github.com/colinhacks/zod/issues/3751
export const CredentialFieldsSchema: z.ZodObject<{
  id: z.ZodString;
  level: z.ZodString;
  issued: z.ZodOptional<z.ZodDate>;
  approvedAt: z.ZodOptional<z.ZodDate>;
  expirationDate: z.ZodOptional<z.ZodDate>;
}> = z.object({
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
export const CredentialResidentialAddressSchema: z.ZodObject<{
  street: z.ZodString;
  houseNumber: z.ZodOptional<z.ZodString>;
  additionalAddressInfo: z.ZodOptional<z.ZodString>;
  region: z.ZodOptional<z.ZodString>;
  city: z.ZodString;
  postalCode: z.ZodString;
  country: z.ZodString;
  proofCategory: z.ZodString;
  proofDateOfIssue: z.ZodOptional<z.ZodDate>;
  proofFile: z.ZodType<Buffer<ArrayBufferLike>>;
}> = z.object({
  /* Street address. */
  street: z.string(),

  /* House number. */
  houseNumber: z.string().optional(),

  /* Additional address information (e.g., apartment number). */
  additionalAddressInfo: z.string().optional(),

  /* Region (e.g., state, province). */
  region: z.string().optional(),

  /* Locality (e.g., city, town). */
  city: z.string(),

  /* Postal code. */
  postalCode: z.string(),

  /* Country (ISO 3166-1 alpha-2). */
  country: z.string().min(2).max(2),

  /* Residential Address Proof Category	Type of document provided to verify the address(e.g., utility bill, bank statement). */
  proofCategory: z.string(),

  /* Residential Address Proof Date Of Issue	Date the address proof document was issued. */
  proofDateOfIssue: z.date().optional(),

  /* Residential Address Proof File	File or URL of the document provided as address proof. */
  proofFile: z.instanceof(Buffer),
});

export type CredentialResidentialAddress = z.infer<typeof CredentialFieldsSchema>;

export const IDDocumentTypeSchema: z.ZodEnum<{
  PASSPORT: "PASSPORT";
  DRIVERS: "DRIVERS";
  ID_CARD: "ID_CARD";
}> = z.enum(["PASSPORT", "DRIVERS", "ID_CARD"]);
export type IDDocumentType = z.infer<typeof IDDocumentTypeSchema>;

export const GenderSchema: z.ZodEnum<{
  M: "M";
  F: "F";
  OTHER: "OTHER";
}> = z.enum(["M", "F", "OTHER"]);
export type Gender = z.infer<typeof GenderSchema>;

// https://github.com/colinhacks/zod/issues/3751
export const CredentialSubjectSchema: z.ZodObject<{
  id: z.ZodString;
  applicantId: z.ZodOptional<z.ZodString>;
  inquiryId: z.ZodOptional<z.ZodString>;
  firstName: z.ZodString;
  middleName: z.ZodOptional<z.ZodString>;
  ssn: z.ZodOptional<z.ZodString>;
  gender: z.ZodOptional<typeof GenderSchema>;
  nationality: z.ZodOptional<z.ZodString>;
  familyName: z.ZodString;
  maidenName: z.ZodOptional<z.ZodString>;
  governmentId: z.ZodOptional<z.ZodString>;
  governmentIdType: z.ZodOptional<z.ZodString>;
  dateOfBirth: z.ZodDate;
  placeOfBirth: z.ZodOptional<z.ZodString>;
  email: z.ZodOptional<z.ZodEmail>;
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
}> = z.object({
  /* ID(unique credential)	Unique identifier for the credential itself. */
  id: z.string(),

  /* Applicant ID. */
  applicantId: z.string().optional(),

  /* Inquiry ID. */
  inquiryId: z.string().optional(),

  /* First name. */
  firstName: z.string(),

  /* Middle name. */
  middleName: z.string().optional(),

  /* Social-security-number (without dashes) */
  ssn: z.string().min(9).max(9).optional(),

  /* Nationality (ISO 3166-1 alpha-2). */
  nationality: z.string().min(2).max(2).optional(),

  /* Gender (M or F, empty if not provided). */
  gender: GenderSchema.optional(),

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
});

export type CredentialSubject = z.infer<typeof CredentialSubjectSchema>;

export interface VerifiableCredentialSubject extends Omit<CredentialSubject, "residentialAddress"> {
  "@context": string;
  residentialAddressStreet?: string;
  residentialAddressHouseNumber?: string;
  residentialAddressAdditionalAddressInfo?: string;
  residentialAddressRegion?: string;
  residentialAddressCity?: string;
  residentialAddressPostalCode?: string;
  residentialAddressCountry?: string;
  residentialAddressProofCategory?: string;
  residentialAddressProofDateOfIssue?: string;
  residentialAddressProofFile?: Buffer<ArrayBufferLike>;
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
