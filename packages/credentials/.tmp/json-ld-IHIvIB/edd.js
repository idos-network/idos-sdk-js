"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EDDSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
// https://github.com/colinhacks/zod/issues/3751
exports.EDDSchema = zod_1.z.object({
    /* The person's occupation or job title. */
    occupation: enums_1.OccupationSchema.optional(),
    /* A file containing proof of the person's source of funds (e.g. bank statement, salary slip, investment statement). */
    sourceOfFundsProof: zod_1.z.instanceof(Buffer).optional(),
});
