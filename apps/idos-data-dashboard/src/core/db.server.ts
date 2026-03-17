import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { SERVER_ENV } from "@/core/envFlags.server";

import * as schema from "./db/schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Returns the Drizzle DB instance for the legacy app (Neon Postgres).
 * Use only in community-sale and leaderboard routes.
 * @throws Error if LEGACY_APP_DB_URL is not set
 */
export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    const url = SERVER_ENV.LEGACY_APP_DB_URL;
    if (!url) {
      throw new Error(
        "LEGACY_APP_DB_URL is not set. Configure it in .env.local to use the legacy app database.",
      );
    }
    pool = new Pool({ connectionString: url });
    db = drizzle(pool, { schema });
  }
  return db;
}
