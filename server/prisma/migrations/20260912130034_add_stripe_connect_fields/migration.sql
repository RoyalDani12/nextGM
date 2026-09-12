-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "payoutOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeConnectedAccountId" TEXT;
