"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdDocumentSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
// https://github.com/colinhacks/zod/issues/3751
exports.IdDocumentSchema = zod_1.z.object({
    /* The type of identity document used for verification (e.g. PASSPORT, ID_CARD, DRIVERS_LICENSE). */
    type: enums_1.IDDocumentTypeSchema,
    /* The unique number on the identity document (e.g. passport number, ID card number). */
    number: zod_1.z.string().min(1).max(255),
    /* The country of issuance of the identity document (e.g. USA, UK, Germany). */
    country: zod_1.z.string().min(2).max(2),
    /* The date the identity document expires or ceases to be valid (YYYY-MM-DD). */
    dateOfExpiry: zod_1.z.date().optional(),
    /* The date the identity document was issued (YYYY-MM-DD). */
    dateOfIssue: zod_1.z.date().optional(),
    /* The name or code of the authority that issued the identity document (e.g. DVLA for UK driving licences, Bundesdruck­erei for German ID cards). */
    issuingAuthority: zod_1.z.string().min(1).max(255).optional(),
    /* The file containing the identity document (e.g. passport photo, ID card photo). */
    frontFile: zod_1.z.instanceof(Buffer),
    /* The file containing the identity document (e.g. passport photo, ID card photo). */
    backFile: zod_1.z.instanceof(Buffer).optional(),
    /* The Machine-Readable Zone (MRZ) line(s) from the bottom of the identity document — encodes key identity data in a standardised scannable format. Includes mrzLine2 and mrzLine3. */
    mrzLine1: zod_1.z.string().min(1).max(255).optional(),
    /* A title or honorific on the identity document (e.g. Dr, Mr, Ms, Prof). */
    title: zod_1.z.string().min(1).max(255).optional(),
    /* An extended or renewed expiry date when a document's validity has been officially extended beyond its original expiry. */
    extendedValidUntil: zod_1.z.date().optional(),
    /* A secondary personal identification number on the document (e.g. DNI in Spain, CRP in Brazil) — different from the document number itself. */
    additionalNumber: zod_1.z.string().min(1).max(255).optional(),
    /* The person's ethnicity as indicated on the identity document — only present on some national documents. */
    ethnicity: zod_1.z.string().min(1).max(255).optional(),
    /* The state or province that issued the identity document — relevant for jurisdictions where sub-national authorities issue IDs (e.g. US state driver's licences). */
    issuingSubdivision: zod_1.z.string().min(1).max(255).optional(),
});
