import type { PaymentMethod } from "./types/noah";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BankSepa: "SEPA Bank Transfer",
  BankAch: "ACH Bank Transfer",
  BankFedwire: "Fedwire Bank Transfer",
  BankLocal: "Local Bank Transfer",
  IdentifierPix: "PIX Transfer",
} as const;

export function formatPaymentMethod(type: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[type] ?? type;
}
