-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "mainEvm" VARCHAR(255) DEFAULT '',
    "referrerCode" VARCHAR DEFAULT '',
    "cookieConsent" INTEGER,
    "faceSignUserId" VARCHAR,
    "faceSignTokenCreatedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "faceSignToken" VARCHAR,
    "name" VARCHAR,
    "xHandle" VARCHAR DEFAULT '',
    "popCredentialId" VARCHAR,
    "noahCustomerId" VARCHAR,
    "kycCredentialId" VARCHAR,
    "kycIdDocumentCountry" VARCHAR,
    "kycResidentialAddressCountry" VARCHAR,
    "kycKrakenUserId" VARCHAR,
    "kycKrakenStatus" VARCHAR,
    "lastGeneratedKrakenLinkAt" TIMESTAMP(6),
    "kycKrakenLevel" VARCHAR,

    CONSTRAINT "users_id_unique" PRIMARY KEY ("id")
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
    "name" VARCHAR,
    "xHandle" VARCHAR,
    "questPoints" DECIMAL NOT NULL DEFAULT 0.0,
    "socialPoints" DECIMAL NOT NULL DEFAULT 0.0,
    "contributionPoints" INTEGER NOT NULL DEFAULT 0,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER DEFAULT 0,
    "relativeMindshare" DECIMAL DEFAULT 0.0,
    "epoch" INTEGER NOT NULL,
    "contributionTier" VARCHAR DEFAULT 'No Tier',
    "contributionTierNumber" INTEGER DEFAULT 0,
    "contributionMultiplier" BOOLEAN DEFAULT false,
    "gamePoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "leaderboard_checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "env_vars" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "env_vars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_points" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lock_table" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "lock_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_x_sessions" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "codeVerifier" VARCHAR,
    "state" VARCHAR,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_x_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR NOT NULL,
    "pointsReward" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isRepeatable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "referralCode" VARCHAR NOT NULL,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quests" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "questName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(36) DEFAULT '',
    "publicAddress" VARCHAR(255) NOT NULL,
    "walletType" VARCHAR NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallchain_leaderboard" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR NOT NULL,
    "relativeMindshare" DECIMAL NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "epoch" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "wallchain_leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_faceSignUserId_unique" ON "users"("faceSignUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_name_unique" ON "users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_noahCustomerId_unique" ON "users"("noahCustomerId");

-- CreateIndex
CREATE INDEX "main_evm_idx" ON "users"("mainEvm");

-- CreateIndex
CREATE INDEX "name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "referrer_code_idx" ON "users"("referrerCode");

-- CreateIndex
CREATE INDEX "x_handle_idx" ON "users"("xHandle");

-- CreateIndex
CREATE INDEX "user_wallets_user_id_idx" ON "user_wallets"("userId");

-- CreateIndex
CREATE INDEX "user_wallets_wallet_type_idx" ON "user_wallets"("walletType");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_user_address_unique" ON "user_wallets"("userId", "address");

-- CreateIndex
CREATE INDEX "sale_participants_user_id_idx" ON "sale_participants"("user_id");

-- CreateIndex
CREATE INDEX "sale_participants_address_normalized_idx" ON "sale_participants"("address");

-- CreateIndex
CREATE UNIQUE INDEX "sale_participants_user_address_unique" ON "sale_participants"("user_id", "address");

-- CreateIndex
CREATE UNIQUE INDEX "env_vars_key_unique" ON "env_vars"("key");

-- CreateIndex
CREATE UNIQUE INDEX "game_points_user_id_unique" ON "game_points"("user_id");

-- CreateIndex
CREATE INDEX "game_points_user_id_idx" ON "game_points"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_x_sessions_userId_unique" ON "oauth_x_sessions"("userId");

-- CreateIndex
CREATE INDEX "oauth_x_sessions_user_id_idx" ON "oauth_x_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "quests_name_unique" ON "quests"("name");

-- CreateIndex
CREATE INDEX "quests_is_active_idx" ON "quests"("isActive");

-- CreateIndex
CREATE INDEX "quests_is_repeatable_idx" ON "quests"("isRepeatable");

-- CreateIndex
CREATE INDEX "quests_name_idx" ON "quests"("name");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referralCode_unique" ON "referrals"("referralCode");

-- CreateIndex
CREATE INDEX "referrals_referral_code_idx" ON "referrals"("referralCode");

-- CreateIndex
CREATE INDEX "referrals_user_id_idx" ON "referrals"("userId");

-- CreateIndex
CREATE INDEX "user_quests_quest_name_idx" ON "user_quests"("questName");

-- CreateIndex
CREATE INDEX "user_quests_user_id_idx" ON "user_quests"("userId");

-- CreateIndex
CREATE INDEX "user_quests_user_quest_idx" ON "user_quests"("userId", "questName");

-- CreateIndex
CREATE INDEX "user_tokens_public_address_idx" ON "user_tokens"("publicAddress");

-- CreateIndex
CREATE INDEX "user_tokens_refresh_token_idx" ON "user_tokens"("refreshToken");

-- CreateIndex
CREATE INDEX "user_tokens_user_id_idx" ON "user_tokens"("userId");

-- CreateIndex
CREATE INDEX "user_tokens_wallet_type_idx" ON "user_tokens"("walletType");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_user_address_unique" ON "user_tokens"("userId", "publicAddress");
