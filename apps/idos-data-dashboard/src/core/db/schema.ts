import { sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Placeholder table so Drizzle Kit has a schema entry point.
 * Add real tables here for community-sale and leaderboard.
 */
export const placeholder = pgTable("_drizzle_placeholder", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().unique(),
    name: varchar("name").unique(),
    xHandle: varchar("xHandle").default(""),
    mainEvm: varchar("mainEvm", { length: 255 }).default(""),
    referrerCode: varchar("referrerCode").default(""),
    cookieConsent: integer("cookieConsent").default(sql`null`),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("main_evm_idx").on(table.mainEvm)],
);

export const userWallets = pgTable(
  "user_wallets",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar("userId", { length: 36 }).notNull(),
    address: varchar("address").notNull(),
    walletType: varchar("walletType").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("user_wallets_user_id_idx").on(table.userId),
    index("user_wallets_address_idx").on(sql`lower(${table.address})`),
    unique("user_wallets_user_address_unique").on(table.userId, table.address),
  ],
);

export const saleParticipants = pgTable(
  "sale_participants",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    address: varchar("address").notNull(),
    allocation: numeric("allocation").default("0"),
    uncappedAllocation: numeric("uncapped_allocation").default("0"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("sale_participants_user_id_idx").on(table.userId),
    index("sale_participants_address_normalized_idx").on(table.address),
    unique("sale_participants_user_address_unique").on(table.userId, table.address),
  ],
);

export const leaderboardCheckpoint = pgTable("leaderboard_checkpoint", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 36 }),
  name: varchar("name", { length: 255 }),
  xHandle: varchar("xHandle", { length: 255 }),
  questPoints: decimal("questPoints", { precision: 20, scale: 2 }).notNull().default("0.0"),
  gamePoints: integer("gamePoints").notNull().default(0),
  socialPoints: decimal("socialPoints", { precision: 20, scale: 2 }).notNull().default("0.0"),
  contributionTier: varchar("contributionTier", { length: 64 }).default("No Tier"),
  contributionTierNumber: integer("contributionTierNumber").default(0),
  contributionPoints: integer("contributionPoints").notNull().default(0),
  referralCount: integer("referralCount").notNull().default(0),
  totalPoints: integer("totalPoints").notNull().default(0),
  rank: integer("rank").default(0),
  relativeMindshare: decimal("relativeMindshare", { precision: 20, scale: 4 }).default("0.0"),
  epoch: integer("epoch").notNull(),
  contributionMultiplier: boolean("contributionMultiplier").default(false),
});
