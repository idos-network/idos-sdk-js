/*
  Warnings:

  - A unique constraint covering the columns `[wallet_address,wallet_type]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wallet_public_key,wallet_type]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_wallet_address_wallet_type_wallet_public_key_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_address_wallet_type_key" ON "User"("wallet_address", "wallet_type");

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_public_key_wallet_type_key" ON "User"("wallet_public_key", "wallet_type");
