-- AlterEnum
ALTER TYPE "ShopStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM (
  'CERTIFICATE_OF_INCORPORATION',
  'BUSINESS_LICENSE',
  'TAX_CERTIFICATE',
  'PROOF_OF_ADDRESS',
  'OWNER_IDENTITY_FRONT',
  'OWNER_IDENTITY_BACK',
  'BANK_STATEMENT',
  'OPERATING_LICENSE',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable Shop
ALTER TABLE "Shop"
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "rejectionNotes" TEXT,
ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT,
ADD COLUMN IF NOT EXISTS "suspensionNotes" TEXT,
ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "closureReason" TEXT,
ADD COLUMN IF NOT EXISTS "closureNotes" TEXT,
ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reopenedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reopenReason" TEXT,
ADD COLUMN IF NOT EXISTS "adminNotes" TEXT,
ADD COLUMN IF NOT EXISTS "healthScore" INTEGER NOT NULL DEFAULT 70;

-- AlterTable ShopLegalInfo
ALTER TABLE "ShopLegalInfo"
ADD COLUMN IF NOT EXISTS "businessVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN IF NOT EXISTS "taxIdStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN IF NOT EXISTS "taxIdNotes" TEXT,
ADD COLUMN IF NOT EXISTS "taxIdVerifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "registeredAddress" TEXT,
ADD COLUMN IF NOT EXISTS "addressVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN IF NOT EXISTS "addressVerificationNotes" TEXT,
ADD COLUMN IF NOT EXISTS "addressVerifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "ownerKycStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN IF NOT EXISTS "ownerIdType" TEXT,
ADD COLUMN IF NOT EXISTS "ownerIdNumber" TEXT,
ADD COLUMN IF NOT EXISTS "ownerIdCardFront" TEXT,
ADD COLUMN IF NOT EXISTS "ownerIdCardBack" TEXT,
ADD COLUMN IF NOT EXISTS "ownerKycNotes" TEXT,
ADD COLUMN IF NOT EXISTS "ownerKycVerifiedAt" TIMESTAMP(3);

-- CreateTable ShopLegalDocument
CREATE TABLE IF NOT EXISTS "ShopLegalDocument" (
    "id" TEXT NOT NULL,
    "shopLegalInfoId" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopLegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable ShopAdminNote
CREATE TABLE IF NOT EXISTS "ShopAdminNote" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopAdminNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable ShopRiskFlag
CREATE TABLE IF NOT EXISTS "ShopRiskFlag" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "severity" "RiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopRiskFlag_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "ShopLegalDocument_shopLegalInfoId_idx" ON "ShopLegalDocument"("shopLegalInfoId");
CREATE INDEX IF NOT EXISTS "ShopAdminNote_shopId_idx" ON "ShopAdminNote"("shopId");
CREATE INDEX IF NOT EXISTS "ShopRiskFlag_shopId_idx" ON "ShopRiskFlag"("shopId");
CREATE INDEX IF NOT EXISTS "ShopRiskFlag_resolved_idx" ON "ShopRiskFlag"("resolved");

-- Foreign Keys
DO $$ BEGIN
    ALTER TABLE "ShopLegalDocument" ADD CONSTRAINT "ShopLegalDocument_shopLegalInfoId_fkey" FOREIGN KEY ("shopLegalInfoId") REFERENCES "ShopLegalInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ShopAdminNote" ADD CONSTRAINT "ShopAdminNote_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ShopRiskFlag" ADD CONSTRAINT "ShopRiskFlag_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
