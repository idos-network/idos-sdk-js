"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
// https://github.com/colinhacks/zod/issues/3751
exports.PersonSchema = zod_1.z
    .object({
    /* The person's first/given name(s) as on their identity document. */
    firstName: zod_1.z.string().optional(),
    /* The person's family/last name as on their identity document. */
    familyName: zod_1.z.string().optional(),
    /* The person's middle name(s). */
    middleName: zod_1.z.string().optional(),
    /* The person's father's name / patronymic — required in some jurisdictions (e.g. Greece). */
    fatherName: zod_1.z.string().optional(),
    /* The person's maiden name (family name before marriage). */
    maidenName: zod_1.z.string().optional(),
    /* The person's mother's birth name — required in some jurisdictions (e.g. Hungary). */
    motherName: zod_1.z.string().optional(),
    /* The person's gender (M, F, or X). */
    gender: enums_1.GenderSchema.optional(),
    /* The person's nationality country code(s). Can be multiple for dual nationals. (ISO 3166-1 alpha-2). */
    nationality: zod_1.z.string().min(2).max(2).optional(),
    /* A second nationality held by the person, if applicable. (ISO 3166-1 alpha-2). */
    secondNationality: zod_1.z.string().min(2).max(2).optional(),
    /* The person's date of birth (YYYY-MM-DD) */
    dateOfBirth: zod_1.z.date(),
    /* The city/country where the person was born. */
    placeOfBirth: zod_1.z.string().optional(),
    /* The state, region or territory within a country where the person was born. */
    regionOfBirth: zod_1.z.string().optional(),
    /* Boolean flag indicating whether the person is stateless (holds no nationality). */
    stateless: zod_1.z.boolean().optional(),
    /* Boolean flag indicating whether the person holds refugee status. */
    refugeeStatus: zod_1.z.boolean().optional(),
    /* Boolean flag indicating whether the person holds subsidiary protection status (a form of international protection below refugee status). */
    subsidiaryProtectionStatus: zod_1.z.boolean().optional(),
    /* A national identification number specific to the person (e.g. DNI in Spain, PESEL in Poland, CPR in Denmark) — distinct from the document number. */
    nationalIdNumber: zod_1.z.string().optional(),
    /* The person's Tax Identification Number (TIN/VAT number) as issued by a tax authority. */
    taxIdNumber: zod_1.z.string().optional(),
    /* The country that issued the person's Tax Identification Number. */
    taxIdIssuingCountry: zod_1.z.string().min(2).max(2).optional(),
    /* Country where the person is tax-resident — i.e. where they pay taxes. May differ from the TIN-issuing country. */
    taxResidenceCountry: zod_1.z.string().min(2).max(2).optional(),
    /* The person's Social Security Number (US). Broader context: taxpayer identification number for US persons. */
    ssn: zod_1.z.string().optional(),
})
    .refine(
// At least one of firstName or familyName must be present,
(data) => data.firstName || data.familyName, { message: "At least one of firstName or familyName must be provided" })
    .refine(
// At least one of nationality or secondNationality must be present,
(data) => data.stateless || data.nationality || data.secondNationality, { message: "At least one of stateless, nationality, or secondNationality must be provided" });
