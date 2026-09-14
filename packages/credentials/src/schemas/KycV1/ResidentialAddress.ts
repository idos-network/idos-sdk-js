import { IsOptional, IsString, IsISO31661Alpha2 } from "class-validator";

import { Base85FileField, IsoDateField } from "../utils";

/** The residential address, as v1 and v2 describe it: every field optional, no `verified` flag. */
export class ResidentialAddress {
  /* Street address. */
  @IsOptional()
  @IsString()
  street?: string;

  /* House number. */
  @IsOptional()
  @IsString()
  houseNumber?: string;

  /* Additional address information (e.g. apartment number). */
  @IsOptional()
  @IsString()
  additionalAddressInfo?: string;

  /* Region (e.g. state, province). */
  @IsOptional()
  @IsString()
  region?: string;

  /* Locality (e.g. city, town). */
  @IsOptional()
  @IsString()
  city?: string;

  /* Postal code. */
  @IsOptional()
  @IsString()
  postalCode?: string;

  /* Country (ISO 3166-1 alpha-2). */
  @IsOptional()
  @IsISO31661Alpha2()
  country?: string;

  /* Type of document provided to verify the address (e.g. utility bill, bank statement). */
  @IsOptional()
  @IsString()
  proofCategory?: string;

  /* Date the address proof document was issued. */
  @IsOptional()
  @IsoDateField()
  proofDateOfIssue?: Date;

  /* The document provided as address proof. */
  @IsOptional()
  @Base85FileField()
  proofFile?: Buffer;
}
