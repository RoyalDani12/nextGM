-- Manual sync migration: brings DB up to current schema state
-- Run: npx prisma db execute --file prisma/migrations/manual_sync/migration.sql

-- 1. Add missing CheckoutStatus enum
DO $$ BEGIN
  CREATE TYPE "CheckoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create Checkout table
CREATE TABLE IF NOT EXISTS "Checkout" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "totalAmount" DECIMAL(65,30) NOT NULL,
  "status" "CheckoutStatus" NOT NULL DEFAULT 'PENDING',
  "providerPaymentId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Checkout_providerPaymentId_key" ON "Checkout"("providerPaymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Checkout_idempotencyKey_key" ON "Checkout"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Checkout_customerId_idx" ON "Checkout"("customerId");
CREATE INDEX IF NOT EXISTS "Checkout_status_idx" ON "Checkout"("status");
ALTER TABLE "Checkout" DROP CONSTRAINT IF EXISTS "Checkout_customerId_fkey";
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Create PlatformWallet table
CREATE TABLE IF NOT EXISTS "PlatformWallet" (
  "id" TEXT NOT NULL,
  "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformWallet_pkey" PRIMARY KEY ("id")
);

-- 4. Create PlatformWalletTransaction table
CREATE TABLE IF NOT EXISTS "PlatformWalletTransaction" (
  "id" TEXT NOT NULL,
  "checkoutId" TEXT,
  "type" "WalletTransactionType" NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "balanceAfter" DECIMAL(65,30) NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformWalletTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PlatformWalletTransaction_checkoutId_idx" ON "PlatformWalletTransaction"("checkoutId");
ALTER TABLE "PlatformWalletTransaction" DROP CONSTRAINT IF EXISTS "PlatformWalletTransaction_checkoutId_fkey";
ALTER TABLE "PlatformWalletTransaction" ADD CONSTRAINT "PlatformWalletTransaction_checkoutId_fkey"
  FOREIGN KEY ("checkoutId") REFERENCES "Checkout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Add checkoutId to Order (if Order doesn't already have it)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "checkoutId" TEXT;

-- 6. ShopWallet — add missing columns
ALTER TABLE "ShopWallet"
  ADD COLUMN IF NOT EXISTS "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ShopWallet_stripeAccountId_key" ON "ShopWallet"("stripeAccountId");

-- 7. Payment — drop orderId if exists, add checkoutId
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "checkoutId" TEXT;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'orderId'
  ) THEN
    EXECUTE 'UPDATE "Payment" AS payment
             SET "checkoutId" = orders."checkoutId"
             FROM "Order" AS orders
             WHERE payment."orderId" = orders."id"
               AND payment."checkoutId" IS NULL';
    EXECUTE 'ALTER TABLE "Payment" DROP COLUMN "orderId"';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_checkoutId_key" ON "Payment"("checkoutId");
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_checkoutId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_checkoutId_fkey"
  FOREIGN KEY ("checkoutId") REFERENCES "Checkout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. Order.checkoutId FK
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_checkoutId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_checkoutId_fkey"
  FOREIGN KEY ("checkoutId") REFERENCES "Checkout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Order_checkoutId_idx" ON "Order"("checkoutId");

-- 9. Category indexes (idempotent)
CREATE INDEX IF NOT EXISTS "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");

-- 10. Product platformCategory index
CREATE INDEX IF NOT EXISTS "Product_platformCategoryId_status_idx" ON "Product"("platformCategoryId", "status");
