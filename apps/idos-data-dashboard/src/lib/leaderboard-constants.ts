/**
 * Contribution tier minimum points (USD-style thresholds).
 * Replace with actual tier values from your product/backend.
 */
export const CONTRIBUTION_TIERS: string[] = [
  "0",
  "1,000",
  "5,000",
  "10,000",
  "25,000",
  "50,000",
  "100,000",
  "250,000",
  "500,000",
];

export function getTierRangeTooltip(tierNumber: number): string {
  if (tierNumber === 0) {
    return "No contribution points yet";
  }
  const minPoints = CONTRIBUTION_TIERS[tierNumber];
  const nextTier = CONTRIBUTION_TIERS[tierNumber + 1];
  if (!minPoints) return "";
  if (nextTier) {
    const max = Number.parseInt(nextTier.replace(/,/g, ""), 10) - 1;
    return `$${minPoints} - $${max.toLocaleString()}`;
  }
  return `$${minPoints}+`;
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatNumber(value: number | string): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return "0";
  return numberFormatter.format(n);
}
