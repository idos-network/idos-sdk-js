import { IsOptional, IsString, IsISO31661Alpha2 } from "class-validator";

import { Base85FileField, IsoDateField } from "../utils";

/** The identity document, as v1 and v2 describe it: every field optional and untyped. */
export class IdDocument {
  /* The country of issuance of the identity document (ISO 3166-1 alpha-2). */
  @IsOptional()
  @IsISO31661Alpha2()
  country?: string;

  /* The unique number on the identity document. */
  @IsOptional()
  @IsString()
  number?: string;

  /* The type of identity document (e.g. PASSPORT, ID_CARD, DRIVERS). */
  @IsOptional()
  @IsString()
  type?: string;

  /* The date the identity document was issued. */
  @IsOptional()
  @IsoDateField()
  dateOfIssue?: Date;

  /* The date the identity document expires. */
  @IsOptional()
  @IsoDateField()
  dateOfExpiry?: Date;

  /* The file containing the front of the identity document. */
  @IsOptional()
  @Base85FileField()
  frontFile?: Buffer;

  /* The file containing the back of the identity document. */
  @IsOptional()
  @Base85FileField()
  backFile?: Buffer;
}
