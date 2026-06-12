/*
  Warnings:

  - You are about to drop the column `usersAgent` on the `RefreshToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "usersAgent",
ADD COLUMN     "userAgent" TEXT;
