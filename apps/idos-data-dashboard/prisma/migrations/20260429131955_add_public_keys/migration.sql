/*
  Warnings:

  - You are about to drop the column `issuer_auth_key` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "issuer_auth_key",
ADD COLUMN     "consumer_auth_key" TEXT,
ADD COLUMN     "consumer_auth_public_key" VARCHAR(255),
ADD COLUMN     "consumer_enc_public_key" VARCHAR(255);
