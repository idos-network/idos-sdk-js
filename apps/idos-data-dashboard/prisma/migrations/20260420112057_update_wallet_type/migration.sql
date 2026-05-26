/*
  Warnings:

  - The values [FACE_SIGN,STELLAR] on the enum `WalletType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WalletType_new" AS ENUM ('FaceSign', 'EVM', 'NEAR', 'Stellar', 'XRPL');
ALTER TABLE "User" ALTER COLUMN "wallet_type" TYPE "WalletType_new" USING ("wallet_type"::text::"WalletType_new");
ALTER TYPE "WalletType" RENAME TO "WalletType_old";
ALTER TYPE "WalletType_new" RENAME TO "WalletType";
DROP TYPE "public"."WalletType_old";
COMMIT;
