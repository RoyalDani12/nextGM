-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "usersAgent" TEXT;
