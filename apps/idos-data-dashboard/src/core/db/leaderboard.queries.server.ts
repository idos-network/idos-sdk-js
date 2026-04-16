import { getDb } from "@/core/db.server";

import { Prisma } from "../../generated/prisma/client";

const leaderboardEntrySelect = {
  id: true,
  userId: true,
  name: true,
  xHandle: true,
  questPoints: true,
  gamePoints: true,
  socialPoints: true,
  contributionTier: true,
  contributionTierNumber: true,
  contributionPoints: true,
  referralCount: true,
  totalPoints: true,
  rank: true,
  relativeMindshare: true,
  contributionMultiplier: true,
} satisfies Prisma.LeaderboardCheckpointSelect;

type LeaderboardEntryRow = Prisma.LeaderboardCheckpointGetPayload<{
  select: typeof leaderboardEntrySelect;
}>;

type SerializedLeaderboardEntry = Omit<
  LeaderboardEntryRow,
  "questPoints" | "socialPoints" | "relativeMindshare"
> & {
  questPoints: string;
  socialPoints: string;
  relativeMindshare: string | null;
};

function decimalToString(value: Prisma.Decimal | null | undefined): string | null {
  return value ? value.toString() : null;
}

function serializeLeaderboardEntry(row: LeaderboardEntryRow): SerializedLeaderboardEntry {
  return {
    ...row,
    questPoints: row.questPoints.toString(),
    socialPoints: row.socialPoints.toString(),
    relativeMindshare: decimalToString(row.relativeMindshare),
  };
}

export async function getLeaderboardEpochs(): Promise<number[]> {
  const db = getDb();

  const rows = await db.leaderboardCheckpoint.findMany({
    distinct: ["epoch"],
    select: {
      epoch: true,
    },
    orderBy: {
      epoch: "asc",
    },
  });

  return rows.map((r) => r.epoch);
}

export async function getLatestLeaderboardEpoch(): Promise<number> {
  const db = getDb();
  const result = await db.leaderboardCheckpoint.aggregate({
    _max: {
      epoch: true,
    },
  });

  return result._max.epoch ?? 0;
}

export async function getLeaderboardCheckpointEntries(
  epoch: number,
  pageSize: number,
  page: number,
): Promise<SerializedLeaderboardEntry[]> {
  const db = getDb();

  const rows = await db.leaderboardCheckpoint.findMany({
    where: {
      epoch,
    },
    orderBy: {
      rank: "asc",
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
    select: leaderboardEntrySelect,
  });

  return rows.map(serializeLeaderboardEntry);
}

export async function getLeaderboardCheckpointEntriesCount(epoch: number) {
  const db = getDb();

  return db.leaderboardCheckpoint.count({
    where: {
      epoch,
    },
  });
}

export async function getLeaderboardCheckpointUserPosition(userId: string, epoch: number) {
  const db = getDb();

  const row = await db.leaderboardCheckpoint.findFirst({
    where: {
      userId,
      epoch,
    },
    select: leaderboardEntrySelect,
  });

  return row ? serializeLeaderboardEntry(row) : null;
}

export async function getUserByEvmAddress(address: string): Promise<string | null> {
  const db = getDb();

  const result = await db.userWallet.findFirst({
    where: {
      address: {
        equals: address,
        mode: Prisma.QueryMode.insensitive,
      },
    },
    orderBy: {
      id: "asc",
    },
    select: {
      userId: true,
    },
  });

  if (result) {
    return result.userId;
  }

  const fallback = await db.user.findFirst({
    where: {
      mainEvm: {
        equals: address,
        mode: Prisma.QueryMode.insensitive,
      },
    },
    select: {
      id: true,
    },
  });

  return fallback?.id ?? null;
}
