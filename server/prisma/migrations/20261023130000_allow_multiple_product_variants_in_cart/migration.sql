-- A product may have several variant lines in the same cart. The variant-aware
-- unique key already prevents duplicate lines for the same variant.
DROP INDEX IF EXISTS "CartItem_cartId_productId_key";
