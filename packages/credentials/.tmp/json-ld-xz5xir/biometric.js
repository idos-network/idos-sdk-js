"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiometricSchema = void 0;
const zod_1 = require("zod");
// https://github.com/colinhacks/zod/issues/3751
exports.BiometricSchema = zod_1.z.object({
    /* The person's selfie image. */
    selfieFile: zod_1.z.instanceof(Buffer),
    /* A score or flag indicating whether the selfie/liveness photo matches the identity document photo. */
    selfieMatch: zod_1.z.number().optional(),
});
