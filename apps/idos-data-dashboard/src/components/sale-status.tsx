import type { SaleData } from "@/routes/api/sale-data";

import { Skeleton } from "@/components/ui/skeleton";
import { formatSaleNumber } from "@/lib/sale-utils";

function getDisplayPercentage(percentage: number) {
  if (percentage > 0 && percentage < 1) return 1;
  if (percentage > 100) return 100;
  return percentage;
}

function ProgressBar({ min, max, value }: { min: number; max: number; value: number }) {
  const valueInM = value / 1_000_000;
  const maxM = max / 1_000_000;
  const minM = min / 1_000_000;
  const percentage = maxM > 0 ? (valueInM / maxM) * 100 : 0;
  const displayPct = getDisplayPercentage(percentage);
  const pctRounded = `${Math.round(displayPct)}%`;

  const isBetween = valueInM >= minM && valueInM <= maxM;
  const isBelowMin = valueInM < minM;

  const barWidth = isBetween
    ? "90.5%"
    : isBelowMin
      ? `${minM > 0 ? (valueInM / minM) * 100 : 0}%`
      : pctRounded;

  const capStatusLabel =
    valueInM < minM
      ? "Approaching contribution goal..."
      : valueInM <= maxM
        ? "Contribution goal reached"
        : "Max. raise amount exceeded";

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <span className="text-muted-foreground self-center text-sm">Final raise status</span>
      <div className="bg-muted relative mt-2 flex h-5 w-full overflow-hidden rounded-md">
        <div
          className={`bg-primary absolute left-0 z-10 h-5 transition-all duration-500 ${pctRounded === "100%" ? "rounded-md" : "rounded-l-md"}`}
          style={{ width: barWidth }}
        />
      </div>
      <div className="relative flex">
        {pctRounded !== "100%" && !isBetween && !isBelowMin ? null : (
          <div className="absolute top-0" style={{ left: "90%" }}>
            <div className="border-primary h-2 w-0.5 border" />
            <div className="text-muted-foreground -translate-x-1/2 text-xs">
              {isBetween ? `${formatSaleNumber(valueInM)}M` : isBelowMin ? `${minM}M` : `${maxM}M+`}
            </div>
          </div>
        )}
        <div className="text-primary pt-6 text-sm">{capStatusLabel}</div>
      </div>
    </div>
  );
}

function StatRow({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="flex flex-col gap-1 md:flex-row md:justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      {loading ? (
        <Skeleton className="h-5 w-32" />
      ) : (
        <span className="text-sm md:text-end">{value}</span>
      )}
    </div>
  );
}

export function SaleStatus({ data, loading }: { data: SaleData | undefined; loading: boolean }) {
  const totalCommitted = data?.totalSaleContributions ?? 0;
  const maxTarget = data?.maxTarget ?? 0;
  const minTarget = data?.minTarget ?? 0;
  const totalConfirmed = data?.totalConfirmedContributions ?? 0;

  const committedPctOfGoal =
    minTarget > 0
      ? formatSaleNumber((totalCommitted / minTarget) * 100, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      : "0";

  const confirmedPctOfGoal =
    minTarget > 0
      ? formatSaleNumber((totalConfirmed / minTarget) * 100, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      : "0";

  return (
    <div className="bg-card flex w-full flex-col rounded-xl border">
      <h4 className="border-b px-4 py-3 text-sm font-medium">Community Sale Status</h4>

      {data ? (
        <ProgressBar min={minTarget} max={maxTarget} value={totalCommitted} />
      ) : (
        <div className="flex flex-col gap-2 px-4 py-3">
          <span className="text-muted-foreground self-center text-sm">Final raise status</span>
          <Skeleton className="mt-2 h-5 w-full rounded-md" />
          <div className="pt-6 text-sm">&nbsp;</div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t px-4 py-3">
        <StatRow
          label="Total contribution committed (% of goal):"
          value={`USDC ${formatSaleNumber(totalCommitted, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} (${committedPctOfGoal}%)`}
          loading={loading}
        />
        <StatRow
          label="Total contribution confirmed (% of goal):"
          value={`USDC ${formatSaleNumber(totalConfirmed, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} (${confirmedPctOfGoal}%)`}
          loading={loading}
        />
        <StatRow
          label="Final community sale price (FDV):"
          value={`USDC ${formatSaleNumber(data?.currentTokenPrice ?? 0, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} (USDC ${formatSaleNumber(data?.fdv ?? 0)})`}
          loading={loading}
        />
        <StatRow
          label="Total participants:"
          value={formatSaleNumber(data?.investorCount ?? 0)}
          loading={loading}
        />
      </div>
    </div>
  );
}
