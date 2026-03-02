import { z } from "zod";

export const ADDRESS_MIN_LENGTH = 3;
export const ADDRESS_MAX_LENGTH = 70;
export const CITY_MAX_LENGTH = 35;
export const STATE_MAX_LENGTH = 35;
export const ACCOUNT_NUMBER_LENGTH = 22;
export const TAX_ID_LENGTH = 11;

export const CO_ACCOUNT_NUMBER_MIN_LENGTH = 5;
export const CO_ACCOUNT_NUMBER_MAX_LENGTH = 20;
export const CO_TAX_ID_MIN_LENGTH = 9;
export const CO_TAX_ID_MAX_LENGTH = 10;
export const CO_NATIONAL_ID_MIN_LENGTH = 6;
export const CO_NATIONAL_ID_MAX_LENGTH = 10;
export const CO_FOREIGNER_ID_MIN_LENGTH = 6;
export const CO_FOREIGNER_ID_MAX_LENGTH = 7;
export const CO_PASSPORT_MIN_LENGTH = 8;
export const CO_PASSPORT_MAX_LENGTH = 11;

export const MX_TAX_ID_MIN_LENGTH = 12;
export const MX_TAX_ID_MAX_LENGTH = 13;
export const MX_ACCOUNT_NUMBER_LENGTH = 18;

export const PHONE_NUMBER_REGEX: RegExp = /^\+[0-9]{6,15}$/;

export const PaymentPurposeEnum = z.enum([
  "business insurance",
  "family support",
  "education",
  "gift and donation",
  "medical treatment",
  "maintenance expenses",
  "travel",
  "small value remittance",
  "construction expenses",
  "exported goods",
  "service charges",
  "loan payment",
  "property purchase",
  "property rental",
  "shares investment",
  "fund investment",
  "tax payment",
  "personal transfer",
  "salary payment",
  "other fees",
  "other",
  "own account abroad",
  "liberalized remittance",
  "hotel accommodation",
  "advertising expenses",
  "advisory fees",
  "insurance claims",
  "delivery fees",
  "office expenses",
  "royalty fees",
  "transportation fees",
  "utility bills",
]);

// Account Holder Address schema
const AccountHolderAddressSchema = z.object({
  Address: z
    .string()
    .min(ADDRESS_MIN_LENGTH, "Address must be at least 3 characters long")
    .max(ADDRESS_MAX_LENGTH, "Address must not exceed 70 characters")
    .trim(),
  City: z
    .string()
    .min(1, "Town is required")
    .max(CITY_MAX_LENGTH, "Town must not exceed 35 characters")
    .trim(),
  State: z
    .string()
    .min(1, "State/Province is required")
    .max(STATE_MAX_LENGTH, "State/Province must not exceed 35 characters")
    .trim(),
});

// Bank Details schema
const BankDetailsSchema = z.object({
  AccountNumber: z
    .string()
    .length(ACCOUNT_NUMBER_LENGTH, "Account Number (CBU) must be exactly 22 characters")
    .regex(/^\d+$/, "Account Number (CBU) must contain only digits"),
});

// Argentina bank local form schema
export const ARBankLocalFormSchema = z.object({
  countryCode: z.literal("AR"),
  AccountHolderAddress: AccountHolderAddressSchema,
  TaxID: z
    .string()
    .length(TAX_ID_LENGTH, "Tax ID must be exactly 11 characters")
    .regex(/^\d+$/, "Tax ID must contain only digits"),
  PaymentPurpose: PaymentPurposeEnum,
  BankDetails: BankDetailsSchema,
});

export type ARBankLocalFormData = z.infer<typeof ARBankLocalFormSchema>;

// Individual schemas for component usage
export const ARAccountHolderAddressFormSchema = AccountHolderAddressSchema;
export const ARBankDetailsFormSchema = BankDetailsSchema;
export const ARTaxIDFormSchema = z
  .string()
  .length(TAX_ID_LENGTH, "Tax ID must be exactly 11 characters")
  .regex(/^\d+$/, "Tax ID must contain only digits");
export const ARPaymentPurposeFormSchema = PaymentPurposeEnum;

// Colombia-specific schemas
export const COIdentificationTypeEnum = z.enum([
  "TaxID",
  "NationalIDCard",
  "ForeignerID",
  "Passport",
]);

export const COBankEnum = z.enum([
  "Bancolombia",
  "Banco Davivienda S.A.",
  "Banco de Bogotá",
  "BBVA Colombia",
  "Banco de Occidente",
  "Scotiabank Colpatria",
  "Itaú Corpbanca Colombia S.A.",
  "Banco GNB Sudameris",
  "Banco Popular",
  "Banco AV Villas",
  "Banco Agrario",
  "Banco Caja Social BCSC S.A.",
  "Banco Compartir S.A.",
  "Banco Cooperation Coopcentral",
  "Banco Corpbanca Colombia S.A.",
  "Banco Falabella S.A.",
  "Banco Finandina S.A.",
  "Banco Multibank S.A.",
  "Banco Pichincha",
  "Banco Procredit Colombia",
  "Banco Santander de Negocios Colombia S.A.",
  "Bancoomeva",
  "Citibank",
  "Coltefinanciera S.A.",
  "Confiar Cooperativa Financiera",
  "Cooperativa Financiera de Antioquia",
  "Cotrafa Cooperativa Financiera",
  "Financiera Juriscoop Compañía de Financiamiento",
]);

export const COAccountTypeEnum = z.enum(["Checking", "Savings"]);

// Colombia Identification schema with conditional validation
const COIdentificationSchema = z
  .object({
    IDType: COIdentificationTypeEnum,
    ID: z.string().min(1, "ID Code is required"),
  })
  .refine(
    (data) => {
      switch (data.IDType) {
        case "TaxID":
          return data.ID.length >= CO_TAX_ID_MIN_LENGTH && data.ID.length <= CO_TAX_ID_MAX_LENGTH;
        case "NationalIDCard":
          return (
            data.ID.length >= CO_NATIONAL_ID_MIN_LENGTH &&
            data.ID.length <= CO_NATIONAL_ID_MAX_LENGTH
          );
        case "ForeignerID":
          return (
            data.ID.length >= CO_FOREIGNER_ID_MIN_LENGTH &&
            data.ID.length <= CO_FOREIGNER_ID_MAX_LENGTH
          );
        case "Passport":
          return (
            data.ID.length >= CO_PASSPORT_MIN_LENGTH && data.ID.length <= CO_PASSPORT_MAX_LENGTH
          );
        default:
          return true;
      }
    },
    {
      message: "Invalid ID format for the selected ID type",
      path: ["ID"],
    },
  );

// Colombia Bank Details schema
const COBankDetailsSchema = z.object({
  AccountNumber: z
    .string()
    .min(CO_ACCOUNT_NUMBER_MIN_LENGTH, "Account Number must be at least 5 characters")
    .max(CO_ACCOUNT_NUMBER_MAX_LENGTH, "Account Number must not exceed 20 characters")
    .regex(/^\d+$/, "Account Number must contain only digits"),
  Bank: COBankEnum,
  Type: COAccountTypeEnum,
});

// Colombia bank local form schema
export const COBankLocalFormSchema = z.object({
  countryCode: z.literal("CO"),
  AccountHolderAddress: AccountHolderAddressSchema, // Reused from AR
  Identification: COIdentificationSchema,
  PhoneNumber: z
    .string()
    .regex(PHONE_NUMBER_REGEX, "Phone Number must start with + and contain 6-15 digits"),
  PaymentPurpose: PaymentPurposeEnum, // Reused from AR
  BankDetails: COBankDetailsSchema,
});

export type COBankLocalFormData = z.infer<typeof COBankLocalFormSchema>;

// Colombia individual schemas for component usage
export const COAccountHolderAddressFormSchema = AccountHolderAddressSchema;
export const COIdentificationFormSchema = COIdentificationSchema;
export const COPhoneNumberFormSchema = z
  .string()
  .regex(PHONE_NUMBER_REGEX, "Phone Number must start with + and contain 6-15 digits");
export const COPaymentPurposeFormSchema = PaymentPurposeEnum;
export const COBankDetailsFormSchema = COBankDetailsSchema;

// Mexico-specific schemas
// Mexico Bank Details schema (CLABE - 18 digits)
const MXBankDetailsSchema = z.object({
  AccountNumber: z
    .string()
    .length(MX_ACCOUNT_NUMBER_LENGTH, "Account Number (CLABE) must be exactly 18 digits")
    .regex(/^\d{18}$/, "Account Number (CLABE) must contain exactly 18 digits"),
});

// Mexico bank local form schema
export const MXBankLocalFormSchema = z.object({
  countryCode: z.literal("MX"),
  AccountHolderAddress: AccountHolderAddressSchema, // Reused from AR/CO
  TaxID: z
    .string()
    .min(MX_TAX_ID_MIN_LENGTH, "Tax ID (RFC) must be at least 12 characters")
    .max(MX_TAX_ID_MAX_LENGTH, "Tax ID (RFC) must not exceed 13 characters"),
  PhoneNumber: z
    .string()
    .regex(PHONE_NUMBER_REGEX, "Phone Number must start with + and contain 6-15 digits"), // Reused from CO
  PaymentPurpose: PaymentPurposeEnum, // Reused from AR/CO
  BankDetails: MXBankDetailsSchema,
});

export type MXBankLocalFormData = z.infer<typeof MXBankLocalFormSchema>;

// Mexico individual schemas for component usage
export const MXAccountHolderAddressFormSchema = AccountHolderAddressSchema;
export const MXTaxIDFormSchema = z
  .string()
  .min(MX_TAX_ID_MIN_LENGTH, "Tax ID (RFC) must be at least 12 characters")
  .max(MX_TAX_ID_MAX_LENGTH, "Tax ID (RFC) must not exceed 13 characters");
export const MXPhoneNumberFormSchema = z
  .string()
  .regex(PHONE_NUMBER_REGEX, "Phone Number must start with + and contain 6-15 digits"); // Reused from CO
export const MXPaymentPurposeFormSchema = PaymentPurposeEnum;
export const MXBankDetailsFormSchema = MXBankDetailsSchema;

// Dynamic schema factory function
export function createBankLocalSchema(countryCode: string): z.ZodTypeAny {
  switch (countryCode) {
    case "AR":
      return ARBankLocalFormSchema;
    case "CO":
      return COBankLocalFormSchema;
    case "MX":
      return MXBankLocalFormSchema;
    default:
      throw new Error(`Unsupported country code: ${countryCode}`);
  }
}

// Export type for the dynamic schema
export type BankLocalFormSchema = z.infer<ReturnType<typeof createBankLocalSchema>>;
