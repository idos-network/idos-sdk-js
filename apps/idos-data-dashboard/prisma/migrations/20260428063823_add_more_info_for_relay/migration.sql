/*
  Warnings:

  - You are about to drop the column `relay_public_encryption_key` on the `User` table. All the data in the column will be lost.
  - Added the required column `public_encryption_key` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" RENAME COLUMN "relay_public_encryption_key" TO "public_encryption_key";
ALTER TABLE "User" ADD COLUMN     "relay_public_key" TEXT NULL;
