import { IsInt, IsOptional, IsPositive, IsString } from "class-validator";

import { IsoDateField } from "./utils";

/** The envelope: the credential's own fields, alongside `credentialSubject`. */
export class EnvelopeV1 {
  @IsString()
  id: string;

  /* Level of KYC verification performed (e.g. basic, plus+liveness). */
  @IsString()
  level: string;

  /* Date the credential was approved. */
  @IsOptional()
  @IsoDateField()
  approvedAt?: Date;
}

/** `EnvelopeV1` plus a numeric KYC level and the issuance/expiry dates. */
export class EnvelopeV2 extends EnvelopeV1 {
  /* Level of KYC verification performed (1, 2 or 3). */
  @IsOptional()
  @IsInt()
  @IsPositive()
  kycLevel?: number;

  /* @default new Date() */
  @IsOptional()
  @IsoDateField()
  issued?: Date;

  /* Date the credential expires. */
  @IsOptional()
  @IsoDateField()
  expirationDate?: Date;
}
