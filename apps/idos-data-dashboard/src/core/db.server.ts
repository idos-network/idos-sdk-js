import { PrismaPg } from "@prisma/adapter-pg";
import { fieldEncryptionExtension } from "prisma-field-encryption";

import { SERVER_ENV } from "@/core/envFlags.server";

import schemaSource from "../../prisma/schema.prisma?raw";
import { PrismaClient } from "../generated/prisma/client";

const db = globalThis as typeof globalThis & {
  __client?: PrismaClient;
};

function createDbClient(): PrismaClient {
  const url = SERVER_ENV.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in .env.local to use the legacy app database.",
    );
  }

  const adapter = new PrismaPg({ connectionString: url });
  const client = new PrismaClient({ adapter });

  // TODO: Fix this on vercel
  return client.$extends(
    fieldEncryptionExtension({
      encryptionKey: SERVER_ENV.PRISMA_FIELD_ENCRYPTION_KEY,
      schemaSource,
    }),
  ) as PrismaClient;
}

/**
 * Returns the Prisma DB instance for the legacy app (Neon Postgres).
 * Use only in community-sale and leaderboard routes.
 * @throws Error if DATABASE_URL is not set
 */
export function getDb(): PrismaClient {
  if (!db.__client) {
    db.__client = createDbClient();
  }

  return db.__client;
}
