"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const biometric_1 = require("./biometric");
const contact_1 = require("./contact");
const edd_1 = require("./edd");
const idDocument_1 = require("./idDocument");
const person_1 = require("./person");
const residentialAddress_1 = require("./residentialAddress");
const screening_1 = require("./screening");
const sow_1 = require("./sow");
const mapping = {
    person: person_1.PersonSchema,
    contact: contact_1.ContactSchema,
    biometric: biometric_1.BiometricSchema,
    idDocument: idDocument_1.IdDocumentSchema,
    residentialAddress: residentialAddress_1.ResidentialAddressSchema,
    screening: screening_1.ScreeningSchema,
    edd: edd_1.EDDSchema,
    sourceOfWealth: sow_1.SourceOfWealthSchema,
};
exports.default = mapping;
