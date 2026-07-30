import { z } from "zod";

import { IsoDate } from "../../codecs";
import { GenderSchema } from "./enums";

// https://github.com/colinhacks/zod/issues/3751
export const PersonSchema: z.ZodObject<{
  /* Names */
  firstName: z.ZodOptional<z.ZodString>;
  // Indonesian and Indian did not always have last name
  familyName: z.ZodOptional<z.ZodString>;
  middleName: z.ZodOptional<z.ZodString>;
  fatherName: z.ZodOptional<z.ZodString>;
  maidenName: z.ZodOptional<z.ZodString>;
  motherName: z.ZodOptional<z.ZodString>;

  /* Gender */
  gender: z.ZodOptional<typeof GenderSchema>;

  /* Nationality */
  nationality: z.ZodOptional<z.ZodString>;
  secondNationality: z.ZodOptional<z.ZodString>;
  nationalIdNumber: z.ZodOptional<z.ZodString>;
  stateless: z.ZodOptional<z.ZodBoolean>;
  refugeeStatus: z.ZodOptional<z.ZodBoolean>;
  subsidiaryProtectionStatus: z.ZodOptional<z.ZodBoolean>;

  /* Birth details */
  dateOfBirth: typeof IsoDate;
  placeOfBirth: z.ZodOptional<z.ZodString>;
  regionOfBirth: z.ZodOptional<z.ZodString>;

  /* TAX details */
  taxIdNumber: z.ZodOptional<z.ZodString>;
  taxIdIssuingCountry: z.ZodOptional<z.ZodString>;
  taxResidenceCountry: z.ZodOptional<z.ZodString>;
  ssn: z.ZodOptional<z.ZodString>;
}> = z
  .object({
    /* The person's first/given name(s) as on their identity document. */
    firstName: z.string().optional(),

    /* The person's family/last name as on their identity document. */
    familyName: z.string().optional(),

    /* The person's middle name(s). */
    middleName: z.string().optional(),

    /* The person's father's name / patronymic — required in some jurisdictions (e.g. Greece). */
    fatherName: z.string().optional(),

    /* The person's maiden name (family name before marriage). */
    maidenName: z.string().optional(),

    /* The person's mother's birth name — required in some jurisdictions (e.g. Hungary). */
    motherName: z.string().optional(),

    /* The person's gender (M, F, or X). */
    gender: GenderSchema.optional(),

    /* The person's nationality country code(s). Can be multiple for dual nationals. (ISO 3166-1 alpha-2). */
    nationality: z.string().min(2).max(2).optional(),

    /* A second nationality held by the person, if applicable. (ISO 3166-1 alpha-2). */
    secondNationality: z.string().min(2).max(2).optional(),

    /* The person's date of birth (YYYY-MM-DD) */
    dateOfBirth: IsoDate,

    /* The city/country where the person was born. */
    placeOfBirth: z.string().optional(),

    /* The state, region or territory within a country where the person was born. */
    regionOfBirth: z.string().optional(),

    /* Boolean flag indicating whether the person is stateless (holds no nationality). */
    stateless: z.boolean().optional(),

    /* Boolean flag indicating whether the person holds refugee status. */
    refugeeStatus: z.boolean().optional(),

    /* Boolean flag indicating whether the person holds subsidiary protection status (a form of international protection below refugee status). */
    subsidiaryProtectionStatus: z.boolean().optional(),

    /* A national identification number specific to the person (e.g. DNI in Spain, PESEL in Poland, CPR in Denmark) — distinct from the document number. */
    nationalIdNumber: z.string().optional(),

    /* The person's Tax Identification Number (TIN/VAT number) as issued by a tax authority. */
    taxIdNumber: z.string().optional(),

    /* The country that issued the person's Tax Identification Number. */
    taxIdIssuingCountry: z.string().min(2).max(2).optional(),

    /* Country where the person is tax-resident — i.e. where they pay taxes. May differ from the TIN-issuing country. */
    taxResidenceCountry: z.string().min(2).max(2).optional(),

    /* The person's Social Security Number (US). Broader context: taxpayer identification number for US persons. */
    ssn: z.string().optional(),
  })
  .refine(
    // At least one of firstName or familyName must be present,
    (data) => data.firstName || data.familyName,
    { message: "At least one of firstName or familyName must be provided" },
  )
  .refine(
    // At least one of nationality or secondNationality must be present,
    (data) => data.stateless || data.nationality || data.secondNationality,
    { message: "At least one of stateless, nationality, or secondNationality must be provided" },
  );

export type Person = z.infer<typeof PersonSchema>;
