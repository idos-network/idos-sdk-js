import { IsOptional, IsString, IsISO31661Alpha2, IsMimeType, IsEnum } from "class-validator";

import { ResidentialAddressSources, type ResidentialAddressSource } from "../enums";
import { Base85FileField, IsoDateField, RequiredWhen } from "../utils";

export class ResidentialAddress {
  /* How the address was obtained: entered by the user, matched against a database, or verified from a proof document. */
  @IsEnum(ResidentialAddressSources)
  source: ResidentialAddressSource;

  /* Street address. */
  @IsString()
  street: string;

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
  @IsString()
  city: string;

  /* Postal code. */
  @IsOptional()
  @IsString()
  postalCode?: string;

  /* Country (ISO 3166-1 alpha-2). */
  @IsISO31661Alpha2()
  country: string;

  /* Type of document provided to verify the address (e.g. utility bill, bank statement). */
  @RequiredWhen((address: ResidentialAddress) => address.source === "proof")
  @IsString()
  proofCategory?: string;

  /* Date the address proof document was issued. */
  @IsOptional()
  @IsoDateField()
  proofDateOfIssue?: Date;

  /* The document provided as address proof. */
  @RequiredWhen((address: ResidentialAddress) => address.source === "proof")
  @Base85FileField()
  proofFile?: Buffer;

  /* Type of the document provided as address proof. */
  @RequiredWhen((address: ResidentialAddress) => address.source === "proof")
  @IsString()
  @IsMimeType()
  proofFileType?: string;

  /* Name of the document provided as address proof. */
  @RequiredWhen((address: ResidentialAddress) => address.source === "proof")
  @IsString()
  proofFileName?: string;

  /* Country code derived from the IP address used when the applicant registered. */
  @IsOptional()
  @IsISO31661Alpha2()
  ipCountry?: string;
}
