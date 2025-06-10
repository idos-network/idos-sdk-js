import type * as vc from "@digitalbazaar/vc";

export interface CredentialFields {
  id: string;

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: string;

  /* @default Date.now() */
  issued?: Date;

  /* Date the credential was approved. */
  approvedAt?: Date;

  /* Date the credential was revoked. */
  expirationDate?: Date;
}

export interface CredentialResidentialAddress {
  /* Street address. */
  street: string;

  /* House number. */
  houseNumber?: string;

  /* Additional address information (e.g., apartment number). */
  additionalAddressInfo?: string;

  /* Locality (e.g., city, town). */
  city: string;

  /* Postal code. */
  postalCode: string;

  /* Country. */
  country: string;
}

export interface CredentialSubject {
  /* ID(unique credential)	Unique identifier for the credential itself. */
  id: string;

  /* Applicant ID reference. */
  applicantId?: string;

  /* Given name of the individual. */
  firstName: string;

  /* Surname of the individual. */
  familyName: string;

  /* Family name at birth (e.g., maiden name). */
  maidenName?: string;

  /* Unique identifier issued by a government authority (e.g., SSN, Tax ID). */
  governmentId?: string;

  /* Type of government identifier (e.g., Social Security Number, Tax ID, etc.). */
  governmentIdType?: string;

  /* Date of birth of the individual. */
  dateOfBirth: Date;

  /* City and state/province of birth. */
  placeOfBirth: string;

  /* Email address */
  email?: string;

  /* Phone number */
  phoneNumber?: string;

  /* Country that issued the identity document. */
  idDocumentCountry: string;

  /* ID Document Number	Unique number on the identity document. */
  idDocumentNumber: string;

  /* ID Document Type	Type of identity document(e.g., Passport, Driver's License, National ID). */
  idDocumentType: string;

  /* ID Document Date of Issue	Date the identity document was issued. */
  idDocumentDateOfIssue: Date;

  /* ID Document Date of Expiry	Expiration date of the identity document - if applicable. */
  idDocumentDateOfExpiry?: Date;

  /* ID Document Front File	File or URL representing the front of the identity document. */
  idDocumentFrontFile: Buffer;

  /* ID Document Back File	File or URL representing the back of the identity document - if applicable. */
  idDocumentBackFile?: Buffer;

  /* (ID Document) Selfie File	File or URL of a selfie with the identity document for verification purposes. */
  selfieFile: Buffer;

  /* Residential Address	Full residential address of the individual - if applicable. */
  residentialAddress?: CredentialResidentialAddress;

  /* Residential Address Proof Category	Type of document provided to verify the address(e.g., utility bill, bank statement). */
  residentialAddressProofCategory?: string;

  /* Residential Address Proof Date Of Issue	Date the address proof document was issued. */
  residentialAddressProofDateOfIssue?: Date;

  /* Residential Address Proof File	File or URL of the document provided as address proof. */
  residentialAddressProofFile?: Buffer;
}

export interface VerifiableCredentialSubject extends Omit<CredentialSubject, "residentialAddress"> {
  "@context": string;
  residentialAddressStreet?: string;
  residentialAddressHouseNumber?: string;
  residentialAddressAdditionalAddressInfo?: string;
  residentialAddressCity?: string;
  residentialAddressPostalCode?: string;
  residentialAddressCountry?: string;
}

export type VerifiableCredential<K> = vc.VerifiedCredentials<K>;
