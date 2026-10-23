CREATE TYPE "ShippingMethod" AS ENUM ('STANDARD', 'EXPRESS', 'PICKUP');

CREATE TABLE "OrderShipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "ShippingMethod" NOT NULL DEFAULT 'STANDARD',
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimatedDeliveryStart" TIMESTAMP(3),
    "estimatedDeliveryEnd" TIMESTAMP(3),
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "note" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderShipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderShipment_orderId_key" ON "OrderShipment"("orderId");
CREATE INDEX "OrderShipment_method_idx" ON "OrderShipment"("method");
CREATE INDEX "OrderShipment_trackingNumber_idx" ON "OrderShipment"("trackingNumber");

ALTER TABLE "OrderShipment"
ADD CONSTRAINT "OrderShipment_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
