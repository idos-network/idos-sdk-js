/*
  Warnings:

  - You are about to drop the column `public_encryption_key` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "public_encryption_key",
ADD COLUMN     "consumer_enc_key" TEXT,
ADD COLUMN     "issuer_auth_key" TEXT;
