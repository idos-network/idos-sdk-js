"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactSchema = void 0;
const zod_1 = require("zod");
// https://github.com/colinhacks/zod/issues/3751
exports.ContactSchema = zod_1.z.object({
    /* The person's email address. */
    email: zod_1.z.email().optional(),
    /* The person's phone number. */
    phoneNumber: zod_1.z.string().optional(),
});
