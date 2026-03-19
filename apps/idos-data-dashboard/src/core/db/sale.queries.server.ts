import { and, eq, gt, sql } from "drizzle-orm";

import { getDb } from "@/core/db.server";
import { saleParticipants, users } from "@/core/db/schema";

export function generateReferralCode(userId: string): string {
  return btoa(userId).replace(/[+/=]/g, (c) => (c === "+" ? "-" : c === "/" ? "_" : ""));
}

export async function getContributionWallet(userId: string): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ address: saleParticipants.address })
    .from(saleParticipants)
    .where(and(eq(saleParticipants.userId, userId), sql`sale_participants.allocation > 0`));

  return rows[0]?.address ?? null;
}

export async function getReferralsAllocations(userId: string) {
  const db = getDb();
  const referralCode = generateReferralCode(userId);

  const rows = await db
    .select({
      userId: saleParticipants.userId,
      allocation: saleParticipants.allocation,
    })
    .from(users)
    .innerJoin(saleParticipants, eq(saleParticipants.userId, users.id))
    .where(
      and(
        eq(users.referrerCode, referralCode),
        gt(sql`CAST(${saleParticipants.allocation} AS NUMERIC)`, 0),
      ),
    );

  const totalReferralsCountAllocation = new Set(rows.map((r) => r.userId)).size;
  const totalAllocationValue = rows.reduce((sum, item) => sum + Number(item.allocation ?? 0), 0);

  return { totalReferralsCountAllocation, totalAllocationValue };
}

export async function getReferralsUncappedAllocations(userId: string) {
  const db = getDb();
  const referralCode = generateReferralCode(userId);

  const rows = await db
    .select({
      userId: saleParticipants.userId,
      uncappedAllocation: saleParticipants.uncappedAllocation,
    })
    .from(users)
    .innerJoin(saleParticipants, eq(saleParticipants.userId, users.id))
    .where(
      and(
        eq(users.referrerCode, referralCode),
        gt(sql`CAST(${saleParticipants.uncappedAllocation} AS NUMERIC)`, 0),
      ),
    );

  const totalReferralsCountUncapped = new Set(rows.map((r) => r.userId)).size;
  const totalUncappedAllocationValue = rows.reduce(
    (sum, item) => sum + Number(item.uncappedAllocation ?? 0),
    0,
  );

  return { totalReferralsCountUncapped, totalUncappedAllocationValue };
}
