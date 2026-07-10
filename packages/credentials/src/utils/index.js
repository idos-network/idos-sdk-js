"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveKYCLevel = exports.deriveLevel = void 0;
exports.fileToBase85 = fileToBase85;
exports.base85ToFile = base85ToFile;
exports.capitalizeFirstLetter = capitalizeFirstLetter;
exports.issuerToKey = issuerToKey;
exports.convertValues = convertValues;
exports.convertBuilderObject = convertBuilderObject;
exports.parseLevel = parseLevel;
exports.matchLevelOrHigher = matchLevelOrHigher;
exports.levelScore = levelScore;
exports.pickHighestMatchingLevel = pickHighestMatchingLevel;
exports.highestMatchingCredential = highestMatchingCredential;
exports.recordFilter = recordFilter;
exports.buildInsertableIDOSCredential = buildInsertableIDOSCredential;
const ed25519_verification_key_2020_1 = require("@digitalbazaar/ed25519-verification-key-2020");
const codecs_1 = require("@idos-network/utils/codecs");
const base85 = __importStar(require("base85"));
const compat_1 = require("es-toolkit/compat");
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const tweetnacl_1 = __importDefault(require("tweetnacl"));
// TODO: This is latest one (we should have also previous versions)
var utils_1 = require("../schemas/Kyc/v3/utils");
Object.defineProperty(exports, "deriveLevel", { enumerable: true, get: function () { return utils_1.deriveLevel; } });
Object.defineProperty(exports, "deriveKYCLevel", { enumerable: true, get: function () { return utils_1.deriveKYCLevel; } });
function fileToBase85(file) {
    return base85.encode(file, "ascii85");
}
function base85ToFile(data) {
    return base85.decode(data);
}
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function isIssuerKey(issuer) {
    return (typeof issuer === "object" &&
        issuer !== null &&
        "type" in issuer &&
        "id" in issuer &&
        "controller" in issuer);
}
function isCustomIssuerType(issuer) {
    return (typeof issuer === "object" &&
        issuer !== null &&
        "issuer" in issuer &&
        "publicKeyMultibase" in issuer);
}
async function issuerToKey(issuer) {
    if (isIssuerKey(issuer)) {
        return issuer;
    }
    if (isCustomIssuerType(issuer)) {
        return await ed25519_verification_key_2020_1.Ed25519VerificationKey2020.from({
            id: `${issuer.issuer}/keys/1`,
            controller: `${issuer.issuer}/issuers/1`,
            publicKeyMultibase: issuer.publicKeyMultibase,
            privateKeyMultibase: issuer.privateKeyMultibase,
            type: "Ed25519VerificationKey2020",
        });
    }
    return await ed25519_verification_key_2020_1.Ed25519VerificationKey2020.from({ ...issuer, type: "Ed25519VerificationKey2020" });
}
function convertValues(fields, prefix) {
    const acc = {};
    for (const key in fields) {
        if (Object.hasOwn(fields, key)) {
            const value = fields[key];
            const name = prefix ? `${prefix}${capitalizeFirstLetter(key)}` : key;
            if (value instanceof Date) {
                acc[name] = value.toISOString();
            }
            else if (value instanceof Buffer) {
                // Convert file to base85
                acc[name] = fileToBase85(value);
            }
            else {
                acc[name] = value;
            }
        }
    }
    return acc;
}
function convertBuilderObject(object) {
    const acc = {};
    for (const key in object) {
        if (Object.hasOwn(object, key)) {
            const value = object[key];
            Object.assign(acc, convertValues(value, key === "root" ? undefined : key));
        }
    }
    return acc;
}
function parseLevel(level) {
    const [base, ...addons] = level.split("+");
    return { base, addons };
}
function matchLevelOrHigher(level, requiredAddons, currentLevel) {
    const { base: currentBaseLevel, addons: currentAddons } = parseLevel(currentLevel);
    // TODO: Consider pop+ or uniqueness+ scenarios
    if (level === "plus" && currentBaseLevel !== "plus") {
        return false;
    }
    return requiredAddons.every((addon) => currentAddons.includes(addon));
}
function levelScore(level) {
    const { base, addons } = parseLevel(level);
    let score = 0;
    if (base === "plus") {
        score += 100;
    }
    score += addons.length * 10;
    return score;
}
function pickHighestMatchingLevel(levels, requiredLevel, requiredAddons) {
    return (levels
        .filter((currentLevel) => matchLevelOrHigher(requiredLevel, requiredAddons, currentLevel))
        .sort((a, b) => {
        const aAddons = levelScore(a);
        const bAddons = levelScore(b);
        return bAddons - aAddons; // descending
    })[0] ?? null);
}
function highestMatchingCredential(credentials, requiredLevel, { addons: requiredAddons = [], publicNotesConstraint = {}, }) {
    const matchingCredentials = credentials
        .map((credential) => {
        const publicNotes = JSON.parse(credential.public_notes || "{}");
        return {
            credential,
            publicNotes,
        };
    })
        .filter(({ publicNotes }) => {
        const level = publicNotes.level;
        if (!level) {
            return false;
        }
        if (!matchLevelOrHigher(requiredLevel, requiredAddons, level)) {
            return false;
        }
        for (const key in publicNotesConstraint) {
            if (publicNotes[key] !== publicNotesConstraint[key]) {
                return false;
            }
        }
        return true;
    })
        .sort((a, b) => {
        const aLevel = a.publicNotes.level;
        const bLevel = b.publicNotes.level;
        return levelScore(bLevel) - levelScore(aLevel); // descending
    })
        .map(({ credential }) => credential);
    return matchingCredentials[0];
}
function recordFilter(rec, pick, omit) {
    const matchCriteria = (content, criteria) => (0, compat_1.every)(Object.entries(criteria), ([path, targetSet]) => targetSet.includes((0, compat_1.get)(content, path)));
    if (Object.keys(pick).length > 0 && !matchCriteria(rec, pick)) {
        // Fast fail on pick criteria
        return false;
    }
    if (Object.keys(omit).length > 0 && matchCriteria(rec, omit)) {
        // Fast fail on omit criteria
        return false;
    }
    return true;
}
function buildInsertableIDOSCredential(userId, publicNotes, content, encryptorPublicKey) {
    (0, tiny_invariant_1.default)(encryptorPublicKey, "Missing `encryptorPublicKey`");
    const ephemeralAuthenticationKeyPair = tweetnacl_1.default.sign.keyPair();
    const publicNotesSignature = tweetnacl_1.default.sign.detached((0, codecs_1.utf8Encode)(publicNotes), ephemeralAuthenticationKeyPair.secretKey);
    return {
        user_id: userId,
        content,
        public_notes: publicNotes,
        public_notes_signature: (0, codecs_1.base64Encode)(publicNotesSignature),
        broader_signature: (0, codecs_1.base64Encode)(tweetnacl_1.default.sign.detached(Uint8Array.from([...publicNotesSignature, ...(0, codecs_1.base64Decode)(content)]), ephemeralAuthenticationKeyPair.secretKey)),
        issuer_auth_public_key: (0, codecs_1.hexEncode)(ephemeralAuthenticationKeyPair.publicKey, true),
        encryptor_public_key: encryptorPublicKey,
    };
}
