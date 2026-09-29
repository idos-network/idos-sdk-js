import { IsOptional, IsString, IsISO31661Alpha2, IsMimeType, IsEnum } from "class-validator";

import { ResidentialAddressSources, type ResidentialAddressSource } from "../enums";
import { Base85FileField, IsoDateField, RequiredWhen } from "../utils";

export class ResidentialAddress {
  /* How the address was obtained: typed in, autocompleted, from GPS, an external database, or read from an identity or proof-of-address document. */
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

/** `ResidentialAddress`, with a verified address requiring its full proof. */
export type ResidentialAddressFields = ResidentialAddress &
  (
    | ({ verified: true } & Required<
        Pick<ResidentialAddress, "proofCategory" | "proofFile" | "proofFileType" | "proofFileName">
      >)
    | { verified: false }
    | ({ verified: boolean } & Required<
        Pick<ResidentialAddress, "proofCategory" | "proofFile" | "proofFileType" | "proofFileName">
      >)
  );
