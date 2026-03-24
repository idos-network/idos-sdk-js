import { and, asc, count, eq, sql } from "drizzle-orm";

import { getDb } from "@/core/db.server";
import { leaderboardCheckpoint, users, userWallets } from "@/core/db/schema";

export async function getLeaderboardEpochs(): Promise<number[]> {
  const db = getDb();
  const rows = await db
    .selectDistinct({ epoch: leaderboardCheckpoint.epoch })
    .from(leaderboardCheckpoint)
    .orderBy(asc(leaderboardCheckpoint.epoch));
  return rows.map((r) => r.epoch);
}

export async function getLeaderboardCheckpointEntries(
  epoch: number,
  pageSize: number,
  page: number,
) {
  const db = getDb();
  return db
    .select({
      id: leaderboardCheckpoint.id,
      userId: leaderboardCheckpoint.userId,
      name: leaderboardCheckpoint.name,
      xHandle: leaderboardCheckpoint.xHandle,
      questPoints: leaderboardCheckpoint.questPoints,
      gamePoints: leaderboardCheckpoint.gamePoints,
      socialPoints: leaderboardCheckpoint.socialPoints,
      contributionTier: leaderboardCheckpoint.contributionTier,
      contributionTierNumber: leaderboardCheckpoint.contributionTierNumber,
      contributionPoints: leaderboardCheckpoint.contributionPoints,
      referralCount: leaderboardCheckpoint.referralCount,
      totalPoints: leaderboardCheckpoint.totalPoints,
      rank: leaderboardCheckpoint.rank,
      relativeMindshare: leaderboardCheckpoint.relativeMindshare,
      contributionMultiplier: leaderboardCheckpoint.contributionMultiplier,
    })
    .from(leaderboardCheckpoint)
    .where(eq(leaderboardCheckpoint.epoch, epoch))
    .orderBy(asc(leaderboardCheckpoint.rank))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

export async function getLeaderboardCheckpointEntriesCount(epoch: number) {
  const db = getDb();
  const [row] = await db
    .select({ count: count() })
    .from(leaderboardCheckpoint)
    .where(eq(leaderboardCheckpoint.epoch, epoch));
  return row?.count ?? 0;
}

export async function getLeaderboardCheckpointUserPosition(userId: string, epoch: number) {
  const db = getDb();
  const [row] = await db
    .select({
      id: leaderboardCheckpoint.id,
      userId: leaderboardCheckpoint.userId,
      name: leaderboardCheckpoint.name,
      xHandle: leaderboardCheckpoint.xHandle,
      questPoints: leaderboardCheckpoint.questPoints,
      gamePoints: leaderboardCheckpoint.gamePoints,
      socialPoints: leaderboardCheckpoint.socialPoints,
      contributionTier: leaderboardCheckpoint.contributionTier,
      contributionTierNumber: leaderboardCheckpoint.contributionTierNumber,
      contributionPoints: leaderboardCheckpoint.contributionPoints,
      referralCount: leaderboardCheckpoint.referralCount,
      totalPoints: leaderboardCheckpoint.totalPoints,
      rank: leaderboardCheckpoint.rank,
      relativeMindshare: leaderboardCheckpoint.relativeMindshare,
      contributionMultiplier: leaderboardCheckpoint.contributionMultiplier,
    })
    .from(leaderboardCheckpoint)
    .where(and(eq(leaderboardCheckpoint.userId, userId), eq(leaderboardCheckpoint.epoch, epoch)));
  return row ?? null;
}

export async function getUserByEvmAddress(address: string): Promise<string | null> {
  const db = getDb();

  const result = await db
    .select({ userId: userWallets.userId })
    .from(userWallets)
    .where(eq(sql`lower(${userWallets.address})`, address.toLowerCase()))
    .limit(1);

  if (result.length > 0) {
    return result[0].userId;
  }

  const fallback = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(sql`lower(${users.mainEvm})`, address.toLowerCase()))
    .limit(1);

  return fallback.length > 0 ? fallback[0].id : null;
}
