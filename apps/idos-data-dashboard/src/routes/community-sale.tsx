import { useQuery } from "@tanstack/react-query";

import { SaleStatus } from "@/components/sale-status";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatSaleNumber } from "@/lib/sale-utils";
import { useSelector } from "@/machines/provider";
import { selectWalletAddress } from "@/machines/selectors";

import type { SaleData } from "./api/sale-data";

export const handle = { breadcrumb: "Community Sale" };

function useSaleData(address: string | null) {
  return useQuery<SaleData>({
    queryKey: ["sale-data", address],
    queryFn: async () => {
      const res = await fetch(`/api/sale-data?address=${encodeURIComponent(address!)}`);
      if (!res.ok) throw new Error("Failed to fetch sale data");
      return res.json();
    },
    enabled: !!address,
    staleTime: 60_000,
  });
}

function formatUSDC(value: number | undefined): string {
  if (value === undefined) return "USDC 0";
  return `USDC ${formatSaleNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatIDOS(value: number | undefined): string {
  if (value === undefined) return "IDOS 0";
  return `IDOS ${formatSaleNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatAirdrop(bonus: number | undefined, percentage: number | undefined): string {
  if (bonus === undefined || percentage === undefined) return "IDOS 0 (+0%)";
  return `IDOS ${formatSaleNumber(bonus, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (+${percentage}%)`;
}

function ContributionRow({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right">
        {loading ? <Skeleton className="ml-auto h-5 w-24" /> : value}
      </TableCell>
    </TableRow>
  );
}

export default function CommunitySale() {
  const walletAddress = useSelector(selectWalletAddress);
  const { data, isLoading } = useSaleData(walletAddress);

  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 items-center rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">idOS Community Sale</h1>
        <Badge variant="success" className="ml-auto hidden lg:inline-flex">
          Ended Successfully
        </Badge>
      </div>

      <div className="bg-card flex flex-col items-start gap-2 rounded-xl p-4">
        <Badge variant="success" className="lg:hidden">
          Ended Successfully
        </Badge>
        <p className="text-accent-foreground">The IDOS Community Sale has concluded.</p>
        <p className="text-accent-foreground">
          The FADE mechanism has kicked in for price discovery. All your committed contribution has
          been confirmed. Your confirmed IDOS allocation will be distributed to your wallet upon TDE
          (expected Q4 2025).
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 lg:grid-cols-2">
        <SaleStatus data={data} loading={isLoading} />

        <div className="bg-card rounded-xl border">
          <div className="border-b px-4 py-3">
            <h2 className="text-accent-foreground text-sm font-medium">Your Contribution</h2>
          </div>
          <Table>
            <TableBody>
              <ContributionRow
                label="Your committed contribution"
                value={formatUSDC(data?.totalUserInvestedUsdc)}
                loading={isLoading}
              />
              <ContributionRow
                label="Returned contribution"
                value={formatUSDC(data?.returnedContribution)}
                loading={isLoading}
              />
              <ContributionRow
                label="Equal individual cap (calculated by FADE)"
                value={
                  data?.individualCap !== null && data?.individualCap !== undefined
                    ? formatUSDC(data.individualCap)
                    : "N/A"
                }
                loading={isLoading}
              />
              <ContributionRow
                label="Your confirmed contribution"
                value={formatUSDC(data?.confirmedContribution)}
                loading={isLoading}
              />
              <ContributionRow
                label="Your Community Sale IDOS allocation"
                value={formatIDOS(data?.confirmedIdosAllocation)}
                loading={isLoading}
              />
              <ContributionRow
                label="Airdrop: additional IDOS allocation"
                value={formatAirdrop(data?.airdropBonus, data?.airdropPercentage)}
                loading={isLoading}
              />
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
