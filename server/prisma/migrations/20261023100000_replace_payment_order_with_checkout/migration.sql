-- Payments now belong to a checkout, which may include multiple orders.
-- Preserve any legacy payment relationship before removing the obsolete column.
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
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Payment" WHERE "checkoutId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate Payment: one or more records have no checkoutId.';
  END IF;
END $$;

ALTER TABLE "Payment" ALTER COLUMN "checkoutId" SET NOT NULL;
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "orderId";
