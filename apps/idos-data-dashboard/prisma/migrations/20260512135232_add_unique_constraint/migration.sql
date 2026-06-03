/*
  Warnings:

  - A unique constraint covering the columns `[wallet_address,wallet_type]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_address_wallet_type_key" ON "User"("wallet_address", "wallet_type");
