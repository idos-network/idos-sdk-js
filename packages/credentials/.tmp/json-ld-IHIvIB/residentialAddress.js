"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentialAddressSchema = void 0;
const zod_1 = require("zod");
// https://github.com/colinhacks/zod/issues/3751
exports.ResidentialAddressSchema = zod_1.z.object({
    /* Street address. */
    street: zod_1.z.string(),
    /* House number. */
    houseNumber: zod_1.z.string().optional(),
    /* Additional address information (e.g., apartment number). */
    additionalAddressInfo: zod_1.z.string().optional(),
    /* Region (e.g., state, province). */
    region: zod_1.z.string().optional(),
    /* Locality (e.g., city, town). */
    city: zod_1.z.string(),
    /* Postal code. */
    postalCode: zod_1.z.string().optional(),
    /* Country (ISO 3166-1 alpha-2). */
    country: zod_1.z.string().min(2).max(2),
    /* Residential Address Proof Category	Type of document provided to verify the address(e.g., utility bill, bank statement). */
    proofCategory: zod_1.z.string(),
    /* Residential Address Proof Date Of Issue	Date the address proof document was issued. */
    proofDateOfIssue: zod_1.z.date().optional(),
    /* Residential Address Proof File or URL of the document provided as address proof. */
    proofFile: zod_1.z.instanceof(Buffer),
    /* Country code derived from the IP address used when the applicant registered in Sumsub — indicates where they were located. */
    ipCountry: zod_1.z.string().min(2).max(2).optional(),
});
