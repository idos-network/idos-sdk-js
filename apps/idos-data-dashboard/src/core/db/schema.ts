import { pgTable, serial, text } from "drizzle-orm/pg-core";

/**
 * Placeholder table so Drizzle Kit has a schema entry point.
 * Add real tables here for community-sale and leaderboard.
 */
export const placeholder = pgTable("_drizzle_placeholder", {
  id: serial("id").primaryKey(),
  name: text("name"),
});
