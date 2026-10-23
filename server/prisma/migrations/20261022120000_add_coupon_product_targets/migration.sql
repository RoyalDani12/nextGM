CREATE TABLE "CouponProduct" (
    "couponId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "CouponProduct_pkey" PRIMARY KEY ("couponId", "productId")
);

CREATE INDEX "CouponProduct_productId_idx" ON "CouponProduct"("productId");

ALTER TABLE "CouponProduct"
ADD CONSTRAINT "CouponProduct_couponId_fkey"
FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponProduct"
ADD CONSTRAINT "CouponProduct_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
