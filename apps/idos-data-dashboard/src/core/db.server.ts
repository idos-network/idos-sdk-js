import { PrismaPg } from "@prisma/adapter-pg";

import { SERVER_ENV } from "@/core/envFlags.server";

import { PrismaClient } from "../generated/prisma/client";

const db = globalThis as typeof globalThis & {
  __client?: PrismaClient;
};

function createDbClient(): PrismaClient {
  const url = SERVER_ENV.LEGACY_APP_DB_URL;
  if (!url) {
    throw new Error(
      "LEGACY_APP_DB_URL is not set. Configure it in .env.local to use the legacy app database.",
    );
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

/**
 * Returns the Prisma DB instance for the legacy app (Neon Postgres).
 * Use only in community-sale and leaderboard routes.
 * @throws Error if LEGACY_APP_DB_URL is not set
 */
export function getDb(): PrismaClient {
  if (!db.__client) {
    db.__client = createDbClient();
  }

  return db.__client;
}
