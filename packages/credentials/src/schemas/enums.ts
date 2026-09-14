/*
 * Enum values as `as const` arrays: `@IsIn(...)` validates against the array and the union
 * type is derived from it, so each set of values is written once.
 */

export const IntendedUses = [
  "INVESTING",
  "PAYMENT_TO_FRIENDS_FAMILY_OR_OTHERS",
  "PURCHASE_DIGITAL_ASSETS",
  "ONLINE_PURCHASES_OF_GOODS_OR_SERVICES",
  "TRADING",
] as const;
export type IntendedUse = (typeof IntendedUses)[number];

export const IDDocumentTypes = [
  "PASSPORT",
  "DRIVERS",
  "ID_CARD",
  "VOTING_CARD",
  "PAN_CARD",
  "INTERNAL_PASSPORT",
  "RESIDENCE_PERMIT",
] as const;
export type IDDocumentType = (typeof IDDocumentTypes)[number];

export const ScreeningResults = ["CLEAR", "NOT_CHECKED"] as const;
export type ScreeningResult = (typeof ScreeningResults)[number];

export const Genders = ["M", "F", "OTHER"] as const;
export type Gender = (typeof Genders)[number];

export const EmploymentStatuses = [
  "EMPLOYED",
  "SELF_EMPLOYED",
  "UNEMPLOYED",
  "RETIRED",
  "STUDENT",
] as const;
export type EmploymentStatus = (typeof EmploymentStatuses)[number];

export const ExpectedMonthlyTransactionCounts = [
  "LESS_THAN_5",
  "BETWEEN_5_AND_10",
  "MORE_THAN_10",
] as const;
export type ExpectedMonthlyTransactionCount = (typeof ExpectedMonthlyTransactionCounts)[number];

export const ExpectedMonthlyTransactionVolumes = [
  "LESS_THAN_500",
  "MORE_THAN_500_LESS_THAN_2000",
  "MORE_THAN_2000",
] as const;
export type ExpectedMonthlyTransactionVolume = (typeof ExpectedMonthlyTransactionVolumes)[number];

export const SourceOfWealthTypes = [
  "SALARY",
  "SAVINGS",
  "INVESTMENTS",
  "CRYPTO_TRADING",
  "OTHER",
] as const;
export type SourceOfWealthType = (typeof SourceOfWealthTypes)[number];

export const YearlyGrossIncomes = [
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
  "FROM_150001_TO_200000",
  "FROM_200001_TO_500000",
  "MORE_THAN_500000",
] as const;
export type YearlyGrossIncome = (typeof YearlyGrossIncomes)[number];

export const ApproximateNetWorths = [
  "UP_TO_25000",
  "BETWEEN_25001_AND_50000",
  "BETWEEN_50001_AND_100000",
  "BETWEEN_100001_AND_300000",
  "BETWEEN_300001_AND_500000",
  "BETWEEN_500001_AND_1000000",
  "OVER_1000001",
] as const;
export type ApproximateNetWorth = (typeof ApproximateNetWorths)[number];

export const Occupations = [
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
] as const;
export type Occupation = (typeof Occupations)[number];

export const Currencies = ["EUR", "USD", "GBP", "OTHER"] as const;
export type Currency = (typeof Currencies)[number];
