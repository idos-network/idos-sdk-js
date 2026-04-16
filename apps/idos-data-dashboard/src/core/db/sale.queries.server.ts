import { getDb } from "@/core/db.server";

import { Prisma } from "../../generated/prisma/client";

const ZERO_DECIMAL = new Prisma.Decimal(0);

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;

  const parsed = Number(value.toString());
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function generateReferralCode(userId: string): string {
  return btoa(userId).replace(/[+/=]/g, (c) => (c === "+" ? "-" : c === "/" ? "_" : ""));
}

export async function getContributionWallet(userId: string): Promise<string | null> {
  const db = getDb();

  const row = await db.saleParticipant.findFirst({
    where: {
      userId,
      allocation: {
        gt: ZERO_DECIMAL,
      },
    },
    orderBy: {
      id: "asc",
    },
    select: {
      address: true,
    },
  });

  return row?.address ?? null;
}

export async function getReferralsAllocations(userId: string) {
  const db = getDb();
  const referralCode = generateReferralCode(userId);

  const referredUsers = await db.user.findMany({
    where: {
      referrerCode: referralCode,
    },
    select: {
      id: true,
    },
  });

  if (referredUsers.length === 0) {
    return { totalReferralsCountAllocation: 0, totalAllocationValue: 0 };
  }

  const rows = await db.saleParticipant.findMany({
    where: {
      userId: {
        in: referredUsers.map((user) => user.id),
      },
      allocation: {
        gt: ZERO_DECIMAL,
      },
    },
    select: {
      userId: true,
      allocation: true,
    },
  });

  const totalReferralsCountAllocation = new Set(rows.map((r) => r.userId)).size;
  const totalAllocationValue = rows.reduce(
    (sum, item) => sum + decimalToNumber(item.allocation),
    0,
  );

  return { totalReferralsCountAllocation, totalAllocationValue };
}

export async function getReferralsUncappedAllocations(userId: string) {
  const db = getDb();
  const referralCode = generateReferralCode(userId);

  const referredUsers = await db.user.findMany({
    where: {
      referrerCode: referralCode,
    },
    select: {
      id: true,
    },
  });

  if (referredUsers.length === 0) {
    return { totalReferralsCountUncapped: 0, totalUncappedAllocationValue: 0 };
  }

  const rows = await db.saleParticipant.findMany({
    where: {
      userId: {
        in: referredUsers.map((user) => user.id),
      },
      uncappedAllocation: {
        gt: ZERO_DECIMAL,
      },
    },
    select: {
      userId: true,
      uncappedAllocation: true,
    },
  });

  const totalReferralsCountUncapped = new Set(rows.map((r) => r.userId)).size;
  const totalUncappedAllocationValue = rows.reduce(
    (sum, item) => sum + decimalToNumber(item.uncappedAllocation),
    0,
  );

  return { totalReferralsCountUncapped, totalUncappedAllocationValue };
}
