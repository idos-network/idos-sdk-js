import { IsOptional, IsString, IsISO31661Alpha2, IsMimeType, IsEnum } from "class-validator";

import { ResidentialAddressSources, type ResidentialAddressSource } from "../enums";
import { Base85FileField, IsoDateField, RequiredWhen, Transliterate } from "../utils";

export class ResidentialAddress {
  /* How the address was obtained: typed in, autocompleted, from GPS, an external database, or read from an identity or proof-of-address document. */
  @IsEnum(ResidentialAddressSources)
  source: ResidentialAddressSource;

  /* Street address. */
  @Transliterate()
  @IsString()
  street: string;
  declare readonly streetIcao?: string;
  declare readonly streetLatin?: Promise<string | undefined>;

  /* House number. */
  @IsOptional()
  @IsString()
  houseNumber?: string;

  /* Additional address information (e.g. apartment number). */
  @Transliterate()
  @IsOptional()
  @IsString()
  additionalAddressInfo?: string;
  declare readonly additionalAddressInfoIcao?: string;
  declare readonly additionalAddressInfoLatin?: Promise<string | undefined>;

  /* Region (e.g. state, province). */
  @Transliterate()
  @IsOptional()
  @IsString()
  region?: string;
  declare readonly regionIcao?: string;
  declare readonly regionLatin?: Promise<string | undefined>;

  /* Locality (e.g. city, town). */
  @Transliterate()
  @IsString()
  city: string;
  declare readonly cityIcao?: string;
  declare readonly cityLatin?: Promise<string | undefined>;

  /* Postal code. */
  @IsOptional()
  @IsString()
  postalCode?: string;

  /* Country (ISO 3166-1 alpha-2). */
  @IsISO31661Alpha2()
  country: string;

  /* Type of document provided to verify the address (e.g. utility bill, bank statement). */
  @RequiredWhen((address: ResidentialAddress) => address.source === "PROOF_OF_ADDRESS")
  @IsString()
  proofCategory?: string;

  /* Date the address proof document was issued. */
  @IsOptional()
  @IsoDateField()
  proofDateOfIssue?: Date;

  /* The document provided as address proof. */
  @RequiredWhen((address: ResidentialAddress) => address.source === "PROOF_OF_ADDRESS")
  @Base85FileField()
  proofFile?: Buffer;

  /* Type of the document provided as address proof. */
  @RequiredWhen((address: ResidentialAddress) => address.source === "PROOF_OF_ADDRESS")
  @IsString()
  @IsMimeType()
  proofFileType?: string;

  /* Name of the document provided as address proof. */
  @RequiredWhen((address: ResidentialAddress) => address.source === "PROOF_OF_ADDRESS")
  @IsString()
  proofFileName?: string;

  /* Country code derived from the IP address used when the applicant registered. */
  @IsOptional()
  @IsISO31661Alpha2()
  ipCountry?: string;
}
