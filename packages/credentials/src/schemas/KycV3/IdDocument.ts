import { IsIn, IsOptional, IsISO31661Alpha2, Length } from "class-validator";

import { IDDocumentTypes, type IDDocumentType } from "../enums";
import { Base85FileField, IsoDateField } from "../utils";

export class IdDocument {
  /* The type of identity document used for verification (e.g. PASSPORT, ID_CARD, DRIVERS). */
  @IsIn(IDDocumentTypes)
  type: IDDocumentType;

  /* The unique number on the identity document (e.g. passport number, ID card number). */
  @Length(1, 255)
  number: string;

  /* The country of issuance of the identity document. */
  @IsISO31661Alpha2()
  country: string;

  /* The date the identity document expires or ceases to be valid. */
  @IsOptional()
  @IsoDateField()
  dateOfExpiry?: Date;

  /* The date the identity document was issued. */
  @IsOptional()
  @IsoDateField()
  dateOfIssue?: Date;

  /* The authority that issued the document (e.g. DVLA, Bundesdruckerei). */
  @IsOptional()
  @Length(1, 255)
  issuingAuthority?: string;

  /* The file containing the front of the identity document. */
  @Base85FileField()
  frontFile: Buffer;

  /* The file containing the back of the identity document. */
  @IsOptional()
  @Base85FileField()
  backFile?: Buffer;

  /* The Machine-Readable Zone (MRZ) line from the document. Includes mrzLine2 and mrzLine3. */
  @IsOptional()
  @Length(1, 255)
  mrzLine1?: string;

  /* A title or honorific on the identity document (e.g. Dr, Mr, Ms, Prof). */
  @IsOptional()
  @Length(1, 255)
  title?: string;

  /* An extended expiry date when the document's validity has been officially extended. */
  @IsOptional()
  @IsoDateField()
  extendedValidUntil?: Date;

  /* A secondary personal identification number on the document (e.g. DNI in Spain, CRP in Brazil). */
  @IsOptional()
  @Length(1, 255)
  additionalNumber?: string;

  /* The person's ethnicity as indicated on the document — only present on some national documents. */
  @IsOptional()
  @Length(1, 255)
  ethnicity?: string;

  /* The state or province that issued the document (e.g. US state driver's licenses). */
  @IsOptional()
  @Length(1, 255)
  issuingSubdivision?: string;
}
