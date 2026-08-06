import { IsEmail, IsOptional, IsString, IsISO31661Alpha2 } from "class-validator";

import { IdDocument } from "../KycV1/IdDocument";
import { ResidentialAddress } from "../KycV1/ResidentialAddress";
import { Base85FileField, IsoDateField, Section } from "../utils";

/** v1's subject, minus the applicant/inquiry and government-id fields v2 dropped. */
export class Subject {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsISO31661Alpha2()
  nationality?: string;

  @IsOptional()
  @IsString()
  familyName?: string;

  @IsOptional()
  @IsString()
  maidenName?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  ssn?: string;

  @IsOptional()
  @IsoDateField()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @IsOptional()
  @Base85FileField()
  selfieFile?: Buffer;

  @Section(() => IdDocument)
  @IsOptional()
  idDocument?: IdDocument;

  @Section(() => ResidentialAddress)
  @IsOptional()
  residentialAddress?: ResidentialAddress;
}
