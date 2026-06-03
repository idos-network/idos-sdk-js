-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('FACE_SIGN', 'EVM', 'NEAR', 'STELLAR', 'XRPL');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_address" VARCHAR(255) NOT NULL,
    "wallet_type" "WalletType" NOT NULL,
    "relay_client_id" UUID,
    "relay_private_key" TEXT NOT NULL,
    "relay_public_encryption_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_address_key" ON "User"("wallet_address");
