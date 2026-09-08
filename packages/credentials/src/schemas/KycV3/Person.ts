import { IsBoolean, IsIn, IsOptional, IsString, IsISO31661Alpha2 } from "class-validator";

import { Genders, type Gender } from "../enums";
import { IsoDateField, RequiredWhen } from "../utils";

export class Person {
  /* The person's first/given name(s) as on their identity document. */
  @RequiredWhen((person: Person) => !person.familyName)
  @IsString()
  firstName?: string;

  /* The person's family/last name as on their identity document. */
  @IsOptional()
  @IsString()
  familyName?: string;

  /* The person's middle name(s). */
  @IsOptional()
  @IsString()
  middleName?: string;

  /* The person's father's name / patronymic — required in some jurisdictions (e.g. Greece). */
  @IsOptional()
  @IsString()
  fatherName?: string;

  /* The person's maiden name (family name before marriage). */
  @IsOptional()
  @IsString()
  maidenName?: string;

  /* The person's mother's birth name — required in some jurisdictions (e.g. Hungary). */
  @IsOptional()
  @IsString()
  motherName?: string;

  /* The person's gender (M, F, or OTHER). */
  @IsOptional()
  @IsIn(Genders)
  gender?: Gender;

  /* The person's nationality country code (ISO 3166-1 alpha-2). */
  @RequiredWhen((person: Person) => !person.stateless && !person.secondNationality)
  @IsISO31661Alpha2()
  nationality?: string;

  /* A second nationality held by the person, if applicable (ISO 3166-1 alpha-2). */
  @IsOptional()
  @IsISO31661Alpha2()
  secondNationality?: string;

  /* The person's date of birth. */
  @IsoDateField()
  dateOfBirth: Date;

  /* The city/country where the person was born. */
  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  /* The state, region or territory within a country where the person was born. */
  @IsOptional()
  @IsString()
  regionOfBirth?: string;

  /* Whether the person is stateless (holds no nationality). */
  @IsOptional()
  @IsBoolean()
  stateless?: boolean;

  /* Whether the person holds refugee status. */
  @IsOptional()
  @IsBoolean()
  refugeeStatus?: boolean;

  /* Whether the person holds subsidiary protection status (below refugee status). */
  @IsOptional()
  @IsBoolean()
  subsidiaryProtectionStatus?: boolean;

  /* A national identification number (e.g. DNI in Spain, PESEL in Poland) — distinct from the document number. */
  @IsOptional()
  @IsString()
  nationalIdNumber?: string;

  /* The person's Tax Identification Number (TIN/VAT number) as issued by a tax authority. */
  @IsOptional()
  @IsString()
  taxIdNumber?: string;

  /* The country that issued the person's Tax Identification Number. */
  @IsOptional()
  @IsISO31661Alpha2()
  taxIdIssuingCountry?: string;

  /* Country where the person is tax-resident. May differ from the TIN-issuing country. */
  @IsOptional()
  @IsISO31661Alpha2()
  taxResidenceCountry?: string;

  /* The person's Social Security Number (US). */
  @IsOptional()
  @IsString()
  ssn?: string;
}
