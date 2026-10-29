-- Customer return requests. This migration is intentionally explicit because
-- existing environments use a manual_sync baseline.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RETURN_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RETURN_UPDATED';

CREATE TYPE "ReturnStatus" AS ENUM (
  'REQUESTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'ITEM_SHIPPED',
  'ITEM_RECEIVED',
  'REFUND_PENDING',
  'REFUNDED',
  'REPLACEMENT_SENT',
  'CLOSED',
  'CANCELLED'
);

CREATE TYPE "ReturnReason" AS ENUM (
  'DAMAGED',
  'WRONG_ITEM',
  'MISSING_ITEM',
  'NOT_AS_DESCRIBED',
  'QUALITY_ISSUE',
  'CHANGED_MIND',
  'OTHER'
);

CREATE TYPE "ReturnResolution" AS ENUM ('REFUND', 'REPLACEMENT');

CREATE TABLE "ReturnRequest" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
  "reason" "ReturnReason" NOT NULL,
  "resolution" "ReturnResolution" NOT NULL DEFAULT 'REFUND',
  "customerNote" TEXT,
  "evidenceUrls" TEXT[] NOT NULL,
  "sellerNote" TEXT,
  "adminNote" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReturnItem" (
  "id" TEXT NOT NULL,
  "returnRequestId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReturnStatusHistory" (
  "id" TEXT NOT NULL,
  "returnRequestId" TEXT NOT NULL,
  "status" "ReturnStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReturnStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReturnRequest_orderId_idx" ON "ReturnRequest"("orderId");
CREATE INDEX "ReturnRequest_customerId_createdAt_idx" ON "ReturnRequest"("customerId", "createdAt");
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");
CREATE UNIQUE INDEX "ReturnItem_returnRequestId_orderItemId_key" ON "ReturnItem"("returnRequestId", "orderItemId");
CREATE INDEX "ReturnItem_orderItemId_idx" ON "ReturnItem"("orderItemId");
CREATE INDEX "ReturnStatusHistory_returnRequestId_createdAt_idx" ON "ReturnStatusHistory"("returnRequestId", "createdAt");

ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnRequestId_fkey"
  FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReturnStatusHistory" ADD CONSTRAINT "ReturnStatusHistory_returnRequestId_fkey"
  FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
