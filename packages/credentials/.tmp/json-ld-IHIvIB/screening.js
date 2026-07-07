"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreeningSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
// https://github.com/colinhacks/zod/issues/3751
exports.ScreeningSchema = zod_1.z.object({
    /* The result of the sanctions screening check — whether the person appears on any sanctions lists (e.g. CLEAR, HIT). */
    sanctionsCheckResult: enums_1.ScreeningResultSchema,
    /* A confidence score (0–100) for the sanctions screening result — indicates how certain the match is. */
    sanctionsConfidenceScore: zod_1.z.number().min(0).max(100).optional(),
    /* The result of the PEP (Politically Exposed Person) screening check (e.g. CLEAR, HIT). */
    pepCheckResult: enums_1.ScreeningResultSchema,
    /* A confidence score (0–100) for the PEP screening result — indicates how certain the match is. */
    pepConfidenceScore: zod_1.z.number().min(0).max(100).optional(),
});
