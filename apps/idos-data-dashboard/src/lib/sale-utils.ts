export function calculateTokenPrice(totalContributed: number): number {
  if (totalContributed < 500_000) {
    return 0.02;
  }

  if (totalContributed > 2_000_000) {
    return 0.08;
  }

  return Number(
    (0.02 + ((0.08 - 0.02) * (totalContributed - 500_000)) / (2_000_000 - 500_000)).toFixed(4),
  );
}

const PRICE_TIERS = [
  { threshold: 500_000, extra: 1 },
  { threshold: 150_000, extra: 0.5 },
  { threshold: 50_000, extra: 0.25 },
  { threshold: 5_000, extra: 0.1 },
  { threshold: 250, extra: 0.05 },
] as const;

export function calculatePriceDiscount(totalContributed: number): number {
  const tier = PRICE_TIERS.find(({ threshold }) => totalContributed >= threshold);
  return tier?.extra ?? 0;
}

export function formatSaleNumber(
  value: number | bigint,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat("default", options).format(value);
}
