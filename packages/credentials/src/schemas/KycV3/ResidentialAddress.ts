import { IsBoolean, IsOptional, IsString, IsISO31661Alpha2 } from "class-validator";

import { Base85FileField, IsoDateField, RequiredWhen } from "../utils";

export class ResidentialAddress {
  /*
   * Whether the address has been verified against the proof document.
   * If false, the address has been manually entered by the user.
   */
  @IsBoolean()
  verified: boolean;

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
  @RequiredWhen((address: ResidentialAddress) => address.verified)
  @IsString()
  proofCategory?: string;

  /* Date the address proof document was issued. */
  @IsOptional()
  @IsoDateField()
  proofDateOfIssue?: Date;

  /* The document provided as address proof. */
  @RequiredWhen((address: ResidentialAddress) => address.verified)
  @Base85FileField()
  proofFile?: Buffer;

  /* Country code derived from the IP address used when the applicant registered. */
  @IsOptional()
  @IsISO31661Alpha2()
  ipCountry?: string;
}
