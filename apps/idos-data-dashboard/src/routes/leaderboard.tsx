import type { ColumnDef } from "@tanstack/react-table";

import { useQuery } from "@tanstack/react-query";

export const handle = { breadcrumb: "Leaderboard" };

import { max } from "drizzle-orm";
import { Link, useLoaderData, useLocation, useNavigation } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { DataTable } from "@/components/ui/data-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from "@/core/db.server";
import {
  getLeaderboardCheckpointEntries,
  getLeaderboardCheckpointEntriesCount,
  getLeaderboardEpochs,
} from "@/core/db/leaderboard.queries.server";
import { leaderboardCheckpoint } from "@/core/db/schema";
import { SERVER_ENV } from "@/core/envFlags.server";
import { formatNumber } from "@/lib/leaderboard-constants";
import { cn } from "@/lib/utils";
import { useSelector } from "@/machines/provider";
import { selectWalletAddress } from "@/machines/selectors";

import type { Route } from "./+types/leaderboard";

const DEFAULT_PAGE_SIZE = 20;

const EPOCH_LABELS: Record<number, string> = {
  1: "Epoch I",
  2: "Epoch II",
  3: "Epoch Ω",
};

function getEpochLabel(epochNum: number): string {
  return EPOCH_LABELS[epochNum] ?? `Epoch ${epochNum}`;
}

function parseSearchParams(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(
      1,
      Number.parseInt(url.searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) ||
        DEFAULT_PAGE_SIZE,
    ),
  );
  const epochParam = url.searchParams.get("epoch");
  const epoch = epochParam ? Number.parseInt(epochParam, 10) : null;
  return { page, pageSize, epoch };
}

function buildSearchParams(page: number, pageSize: number, epoch: number | null): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (epoch != null) params.set("epoch", String(epoch));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function loader(args: Route.LoaderArgs) {
  const { request } = args;
  const { page, pageSize, epoch: epochParam } = parseSearchParams(request);

  if (!SERVER_ENV.LEGACY_APP_DB_URL) {
    return {
      entries: [],
      totalCount: 0,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      epoch: null as number | null,
      totalPages: 0,
      availableEpochs: [] as number[],
    };
  }

  const db = getDb();
  const [epochsResult, maxRow] = await Promise.all([
    getLeaderboardEpochs(),
    db
      .select({ epoch: max(leaderboardCheckpoint.epoch) })
      .from(leaderboardCheckpoint)
      .then((rows) => rows[0]),
  ]);
  const availableEpochs = epochsResult;
  let epoch: number;
  if (epochParam != null && !Number.isNaN(epochParam)) {
    epoch = epochParam;
  } else {
    epoch = maxRow?.epoch ?? 0;
  }

  if (epoch === 0) {
    return {
      entries: [],
      totalCount: 0,
      page: 1,
      pageSize,
      epoch: null as number | null,
      totalPages: 0,
      availableEpochs,
    };
  }

  const [entries, totalCount] = await Promise.all([
    getLeaderboardCheckpointEntries(epoch, pageSize, page),
    getLeaderboardCheckpointEntriesCount(epoch),
  ]);

  const totalPages = Math.ceil(Number(totalCount) / pageSize) || 0;

  return {
    entries,
    totalCount: Number(totalCount),
    page,
    pageSize,
    epoch,
    totalPages,
    availableEpochs,
  };
}

type LeaderboardEntry = Awaited<ReturnType<typeof getLeaderboardCheckpointEntries>>[number];

function parseDecimal(value: string | null | undefined): number {
  if (value == null) return 0;
  const n = Number.parseFloat(String(value));
  return Number.isNaN(n) ? 0 : n;
}

function xProfileUrl(name: string | null, xHandle: string | null): string | null {
  const handle = (name ?? "").startsWith("@")
    ? (name ?? "").slice(1)
    : (xHandle ?? "").replace(/^@/, "");
  if (!handle) return null;
  return `https://x.com/${handle}`;
}

type PaginationPageItem = number | "left-ellipsis" | "right-ellipsis";

function getPaginationItems(page: number, totalPages: number): PaginationPageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (page <= 2) {
    return [1, 2, 3, "right-ellipsis", totalPages];
  }

  if (page >= totalPages - 1) {
    return [1, "left-ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "left-ellipsis", page - 1, page, page + 1, "right-ellipsis", totalPages];
}

function buildLeaderboardColumns(epoch: number | null): ColumnDef<LeaderboardEntry>[] {
  const showArenaPoints = epoch != null && epoch >= 3;

  const cols: ColumnDef<LeaderboardEntry>[] = [
    {
      accessorKey: "rank",
      size: 60,
      header: () => <span className="text-accent-foreground font-normal">Rank</span>,
      cell: ({ row }: { row: { original: LeaderboardEntry } }) => {
        const r = row.original.rank;
        if (r == null) return "—";
        return `#${r}`;
      },
    },
    {
      accessorKey: "name",
      size: 200,
      header: () => (
        <span className="text-accent-foreground block w-full text-left font-normal">Name</span>
      ),
      cell: ({ row }: { row: { original: LeaderboardEntry } }) => {
        const { name, xHandle } = row.original;
        const display = name ?? xHandle ?? "—";
        const url = xProfileUrl(name, xHandle);
        if (url) {
          return (
            <div className="w-full text-left">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary inline-block max-w-[220px] truncate align-bottom hover:underline hover:underline-offset-4"
              >
                {display}
              </a>
            </div>
          );
        }
        return (
          <div className="w-full text-left">
            <span className="block max-w-[220px] truncate">{display}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalPoints",
      size: 120,
      header: () => (
        <div className="text-accent-foreground text-center font-normal">Total Points</div>
      ),
      cell: ({ row }: { row: { original: LeaderboardEntry } }) => {
        const item = row.original;
        const hasMultiplier = item.contributionMultiplier === true;
        return (
          <div className="flex items-center justify-center gap-1">
            <span>{formatNumber(item.totalPoints)}</span>
            {hasMultiplier && (
              <span className="border-primary flex size-5 items-center justify-center rounded-full border-2 text-[10px]">
                1.5x
              </span>
            )}
          </div>
        );
      },
    },
  ];

  if (showArenaPoints) {
    cols.push({
      accessorKey: "gamePoints",
      size: 100,
      header: () => (
        <div className="text-accent-foreground text-center font-normal">Arena Points</div>
      ),
      cell: ({ row }: { row: { original: LeaderboardEntry } }) => {
        const gp = row.original.gamePoints;
        return gp === 0 ? "—" : formatNumber(gp);
      },
    });
  }

  cols.push(
    {
      accessorKey: "questPoints",
      size: 100,
      header: () => (
        <div className="text-accent-foreground text-center font-normal">Quest Points</div>
      ),
      cell: ({ row }: { row: { original: LeaderboardEntry } }) => {
        const q = parseDecimal(row.original.questPoints);
        return q === 0 ? "—" : formatNumber(q);
      },
    },
    {
      accessorKey: "relativeMindshare",
      size: 100,
      header: () => <div className="text-accent-foreground text-center font-normal">Mindshare</div>,
      cell: ({ row }: { row: { original: LeaderboardEntry } }) => {
        const item = row.original;
        const mindshare = parseDecimal(item.relativeMindshare);
        const nameStartsAt = (item.name ?? "").startsWith("@");
        if (mindshare === 0 && !nameStartsAt) return "—";
        if (mindshare <= 0.0001 && nameStartsAt) return "<0.01%";
        return `${(mindshare * 100).toFixed(2)}%`;
      },
    },
    {
      accessorKey: "socialPoints",
      size: 100,
      header: () => (
        <div className="text-accent-foreground text-center font-normal">Social Points</div>
      ),
      cell: ({ row }: { row: { original: LeaderboardEntry } }) => {
        const item = row.original;
        const mindshare = parseDecimal(item.relativeMindshare);
        const social = parseDecimal(item.socialPoints);
        const nameStartsAt = (item.name ?? "").startsWith("@");
        if ((mindshare !== 0 && social === 0) || (nameStartsAt && social === 0)) return "0";
        if (mindshare === 0 && social === 0) return "—";
        return formatNumber(social);
      },
    },
    {
      accessorKey: "contributionTier",
      size: 120,
      header: () => (
        <div className="text-accent-foreground text-center font-normal">Contribution Tier</div>
      ),
      cell: ({ row }: { row: { original: LeaderboardEntry } }) => {
        const tier = row.original.contributionTier;
        return tier ?? "—";
      },
    },
    {
      accessorKey: "contributionPoints",
      size: 130,
      header: () => (
        <div className="text-accent-foreground text-center font-normal">Contribution Points</div>
      ),
      cell: ({ row }: { row: { original: LeaderboardEntry } }) => {
        const cp = row.original.contributionPoints;
        return cp === 0 ? "—" : formatNumber(cp);
      },
    },
  );

  return cols;
}

type UserPositionData = {
  rank: number | null;
  name: string | null;
  xHandle: string | null;
  totalPoints: number;
  questPoints: string | null;
  gamePoints: number;
  socialPoints: string | null;
  contributionTier: string | null;
  relativeMindshare: string | null;
  contributionMultiplier: boolean | null;
};

function useUserLeaderboardPosition(address: string | null, epoch: number | null) {
  return useQuery<UserPositionData | null>({
    queryKey: ["leaderboard-position", address, epoch],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("address", address!);
      params.set("epoch", String(epoch));
      const res = await fetch(`/api/leaderboard-position?${params}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!address && epoch != null && epoch > 0,
    staleTime: 60_000,
  });
}

function UserPositionCard({ data, epoch }: { data: UserPositionData; epoch: number | null }) {
  const showArenaPoints = epoch != null && epoch >= 3;
  const mindshare = parseDecimal(data.relativeMindshare);
  const mindshareDisplay =
    mindshare === 0 ? "—" : mindshare <= 0.0001 ? "<0.01%" : `${(mindshare * 100).toFixed(2)}%`;

  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-accent-foreground mb-3 text-sm font-medium">Your Position</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <p className="text-muted-foreground text-xs">Rank</p>
          <p className="text-lg font-semibold">{data.rank != null ? `#${data.rank}` : "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Total Points</p>
          <p className="text-lg font-semibold">
            {formatNumber(data.totalPoints)}
            {data.contributionMultiplier && (
              <span className="border-primary ml-1 inline-flex size-5 items-center justify-center rounded-full border-2 align-middle text-[10px]">
                1.5x
              </span>
            )}
          </p>
        </div>
        {showArenaPoints && (
          <div>
            <p className="text-muted-foreground text-xs">Arena Points</p>
            <p className="text-lg font-semibold">
              {data.gamePoints === 0 ? "—" : formatNumber(data.gamePoints)}
            </p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-xs">Quest Points</p>
          <p className="text-lg font-semibold">
            {parseDecimal(data.questPoints) === 0
              ? "—"
              : formatNumber(parseDecimal(data.questPoints))}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Mindshare</p>
          <p className="text-lg font-semibold">{mindshareDisplay}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Social Points</p>
          <p className="text-lg font-semibold">
            {parseDecimal(data.socialPoints) === 0
              ? "—"
              : formatNumber(parseDecimal(data.socialPoints))}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Contribution Tier</p>
          <p className="text-lg font-semibold">{data.contributionTier ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}

function UserPositionSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-accent-foreground mb-3 text-sm font-medium">Your Position</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <Skeleton className="mb-1 h-3 w-16 rounded" />
            <Skeleton className="h-6 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { entries, page, pageSize, epoch, totalPages, availableEpochs } =
    useLoaderData<typeof loader>();
  const location = useLocation();
  const pathname = location.pathname;
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading" && navigation.location?.pathname === pathname;

  const pendingEpoch = isNavigating
    ? Number(new URLSearchParams(navigation.location?.search).get("epoch")) || epoch
    : epoch;

  const walletAddress = useSelector(selectWalletAddress);
  const { data: userPosition, isLoading: isLoadingPosition } = useUserLeaderboardPosition(
    walletAddress,
    epoch,
  );

  const prevSearch = page > 1 ? buildSearchParams(page - 1, pageSize, epoch) : null;
  const nextSearch = page < totalPages ? buildSearchParams(page + 1, pageSize, epoch) : null;
  const paginationItems = getPaginationItems(page, totalPages);

  const columns = buildLeaderboardColumns(epoch);

  return (
    <div className="flex min-w-0 flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 flex-wrap items-center justify-between gap-4 rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">idOS Points Leaderboard</h1>
      </div>

      {availableEpochs.length > 0 && (
        <div className="bg-card flex flex-col items-start gap-4 rounded-xl p-4 sm:flex-row sm:items-center">
          <ButtonGroup>
            {availableEpochs.map((e, index) => {
              const isSelected = pendingEpoch === e;
              const search = buildSearchParams(1, pageSize, e);
              return (
                <Link
                  data-slot="button"
                  key={e}
                  to={`${pathname}${search}`}
                  className={cn(
                    buttonVariants({
                      size: "default",
                      variant: isSelected ? "outline" : "ghost",
                    }),
                    "rounded-none shadow-none",
                    !isSelected && "border-0",
                    index > 0 && !isSelected && "border-l border-border",
                    !isSelected &&
                      "text-accent-foreground hover:bg-muted hover:text-accent-foreground dark:hover:bg-muted/50",
                  )}
                >
                  {getEpochLabel(e)}
                </Link>
              );
            })}
          </ButtonGroup>
          {epoch != null && (
            <p className="text-accent-foreground w-full text-center sm:flex-1">
              The idOS App Leaderboard {getEpochLabel(epoch)} has ended. For more details check{" "}
              <a
                href="https://www.idos.network/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                announcement
              </a>
              .
            </p>
          )}
        </div>
      )}

      {walletAddress && isLoadingPosition && <UserPositionSkeleton />}
      {walletAddress && !isLoadingPosition && !userPosition && (
        <div className="bg-card rounded-xl border p-4">
          <p className="text-accent-foreground text-sm font-medium">Your Position</p>
          <p className="text-muted-foreground mt-1 text-sm">You are not ranked in this epoch.</p>
        </div>
      )}
      {userPosition && <UserPositionCard data={userPosition} epoch={epoch} />}

      <div className="flex min-w-0 flex-col items-stretch gap-5">
        <div className="min-w-0">
          <DataTable
            columns={columns}
            data={entries}
            center
            loading={isNavigating}
            skeletonRows={pageSize}
          />
        </div>
        {totalPages > 1 && (
          <div className="bg-card flex justify-center rounded-xl border p-3 sm:justify-end">
            <Pagination className="w-auto justify-center sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    disabled={page <= 1}
                    {...(prevSearch ? { to: `${pathname}${prevSearch}` } : {})}
                  />
                </PaginationItem>
                {paginationItems.map((item) =>
                  typeof item === "string" ? (
                    <PaginationItem key={item}>
                      <PaginationEllipsis className="text-muted-foreground" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={item === page}
                        to={`${pathname}${buildSearchParams(item, pageSize, epoch)}`}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    disabled={page >= totalPages}
                    {...(nextSearch ? { to: `${pathname}${nextSearch}` } : {})}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
