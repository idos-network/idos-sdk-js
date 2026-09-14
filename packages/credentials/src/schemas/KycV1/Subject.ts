import { IsEmail, IsOptional, IsString, IsISO31661Alpha2 } from "class-validator";

import { Base85FileField, IsoDateField, Section } from "../utils";
import { IdDocument } from "./IdDocument";
import { ResidentialAddress } from "./ResidentialAddress";

/*
 * The credential subject. The fields v1 groups under `root` are declared here directly: they
 * travel unprefixed, which is exactly how a class's own fields are flattened.
 */
export class Subject {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  applicantId?: string;

  @IsOptional()
  @IsString()
  inquiryId?: string;

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
  @IsString()
  governmentId?: string;

  @IsOptional()
  @IsString()
  governmentIdType?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  ssn?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

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
