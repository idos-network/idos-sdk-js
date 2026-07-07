"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceOfWealthSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
// https://github.com/colinhacks/zod/issues/3751
exports.SourceOfWealthSchema = zod_1.z.object({
    /* Categories/types of wealth sources declared by the person (e.g. employment, inheritance, investments). */
    type: enums_1.SourceOfWealthTypeSchema,
});
