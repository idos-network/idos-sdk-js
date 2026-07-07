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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccupationSchema = exports.CredentialApproximateNetWorthSchema = exports.CredentialYearlyGrossIncomeSchema = exports.SourceOfWealthTypeSchema = exports.CredentialExpectedMonthlyTransactionVolumeSchema = exports.CredentialExpectedMonthlyTransactionCountSchema = exports.CredentialKycEmploymentStatusSchema = exports.GenderSchema = exports.ScreeningResultSchema = exports.IDDocumentTypeSchema = void 0;
const z = __importStar(require("zod"));
exports.IDDocumentTypeSchema = z.enum([
    "PASSPORT",
    "DRIVERS",
    "ID_CARD",
    "VOTING_CARD",
    "PAN_CARD",
    "INTERNAL_PASSPORT",
    "RESIDENCE_PERMIT",
]);
exports.ScreeningResultSchema = z.enum(["CLEAR", "NOT_CHECKED"]);
exports.GenderSchema = z.enum(["M", "F", "OTHER"]);
exports.CredentialKycEmploymentStatusSchema = z.enum(["EMPLOYED", "SELF_EMPLOYED", "UNEMPLOYED", "RETIRED", "STUDENT"]);
exports.CredentialExpectedMonthlyTransactionCountSchema = z.enum(["LESS_THAN_5", "BETWEEN_5_AND_10", "MORE_THAN_10"]);
exports.CredentialExpectedMonthlyTransactionVolumeSchema = z.enum(["LESS_THAN_500", "MORE_THAN_500_LESS_THAN_2000", "MORE_THAN_2000"]);
exports.SourceOfWealthTypeSchema = z.enum(["SALARY", "SAVINGS", "INVESTMENTS", "CRYPTO_TRADING", "OTHER"]);
exports.CredentialYearlyGrossIncomeSchema = z.enum([
    "LESS_THAN_20000",
    "FROM_20001_TO_30000",
    "FROM_30001_TO_40000",
    "FROM_40001_TO_50000",
    "FROM_50001_TO_60000",
    "FROM_60001_TO_70000",
    "FROM_70001_TO_80000",
    "FROM_80001_TO_90000",
    "FROM_90001_TO_100000",
    "FROM_100001_TO_110000",
    "FROM_110001_TO_120000",
    "FROM_120001_TO_130000",
    "FROM_130001_TO_140000",
    "FROM_140001_TO_150000",
    "MORE_THAN_150000",
    "FROM_150001_TO_200000",
    "FROM_200001_TO_500000",
    "MORE_THAN_500000",
]);
exports.CredentialApproximateNetWorthSchema = z.enum([
    "UP_TO_25000",
    "BETWEEN_25001_AND_50000",
    "BETWEEN_50001_AND_100000",
    "BETWEEN_100001_AND_300000",
    "BETWEEN_300001_AND_500000",
    "BETWEEN_500001_AND_1000000",
    "OVER_1000001",
]);
exports.OccupationSchema = z.enum([
    "AGRICULTURE",
    "ARTS_AND_ENTERTAINMENT",
    "CONSTRUCTION",
    "EDUCATION",
    "FINANCIAL_SERVICES",
    "INFORMATION_AND_TECHNOLOGY",
    "RETAIL",
    "REAL_ESTATE",
    "OTHER",
    "BUSINESS_OWNER",
    "HEALTHCARE",
    "INDUSTRIAL",
    "LEGAL_SERVICES",
    "PUBLIC_SECTOR",
    "SENIOR_MANAGEMENT",
]);
