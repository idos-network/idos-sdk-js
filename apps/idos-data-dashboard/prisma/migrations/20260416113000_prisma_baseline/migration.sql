-- Baseline migration generated from the Prisma schema and then adjusted
-- to preserve the legacy functional wallet-address index.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR,
    "xHandle" VARCHAR DEFAULT '',
    "mainEvm" VARCHAR(255) DEFAULT '',
    "referrerCode" VARCHAR DEFAULT '',
    "cookieConsent" INTEGER,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "address" VARCHAR NOT NULL,
    "walletType" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_participants" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "address" VARCHAR NOT NULL,
    "allocation" DECIMAL DEFAULT 0,
    "uncapped_allocation" DECIMAL DEFAULT 0,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_checkpoint" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(36),
    "name" VARCHAR(255),
    "xHandle" VARCHAR(255),
    "questPoints" DECIMAL(20,2) NOT NULL DEFAULT 0.0,
    "gamePoints" INTEGER NOT NULL DEFAULT 0,
    "socialPoints" DECIMAL(20,2) NOT NULL DEFAULT 0.0,
    "contributionTier" VARCHAR(64) DEFAULT 'No Tier',
    "contributionTierNumber" INTEGER DEFAULT 0,
    "contributionPoints" INTEGER NOT NULL DEFAULT 0,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER DEFAULT 0,
    "relativeMindshare" DECIMAL(20,4) DEFAULT 0.0,
    "epoch" INTEGER NOT NULL,
    "contributionMultiplier" BOOLEAN DEFAULT false,

    CONSTRAINT "leaderboard_checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- CreateIndex
CREATE INDEX "main_evm_idx" ON "users"("mainEvm");

-- CreateIndex
CREATE INDEX "user_wallets_user_id_idx" ON "user_wallets"("userId");

-- CreateIndex
CREATE INDEX "user_wallets_address_idx" ON "user_wallets" (LOWER("address"));

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_user_address_unique" ON "user_wallets"("userId", "address");

-- CreateIndex
CREATE INDEX "sale_participants_user_id_idx" ON "sale_participants"("user_id");

-- CreateIndex
CREATE INDEX "sale_participants_address_idx" ON "sale_participants"("address");

-- CreateIndex
CREATE UNIQUE INDEX "sale_participants_user_address_unique" ON "sale_participants"("user_id", "address");
