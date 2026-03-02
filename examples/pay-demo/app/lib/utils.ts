import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate the fiat amount from crypto amount, rate, and fee
 * @param cryptoAmount - The amount of crypto to convert
 * @param rate - The exchange rate
 * @param fee - The total fee to subtract
 * @returns The calculated fiat amount
 */
export function calculateFiatAmount(cryptoAmount: number, rate: number, fee: number): number {
  if (cryptoAmount === 0 || rate === 0) {
    return 0;
  }
  return cryptoAmount * rate - fee;
}

export function numberFormatOptions(currency: string): Intl.NumberFormatOptions {
  return {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency" as const,
    currency,
  };
}

export function formatAmount(amount: number, currency?: string) {
  return Intl.NumberFormat("en-US", currency ? numberFormatOptions(currency) : undefined).format(
    amount,
  );
}

export function formatFiatAmountForAPI(amount: number): string {
  const decimals = 2;
  const amountStr = amount.toString();
  const decimalIndex = amountStr.indexOf(".");

  if (decimalIndex === -1) {
    return amountStr;
  }

  const integerPart = amountStr.substring(0, decimalIndex);
  const decimalPart = amountStr.substring(decimalIndex + 1);
  const trimmedDecimal = decimalPart.substring(0, decimals);

  return `${integerPart}.${trimmedDecimal}`;
}
