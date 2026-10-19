-- Add the category fields present in the Prisma schema but missing from the
-- original platform-category migration.
ALTER TABLE "Category"
ADD COLUMN "description" TEXT,
ADD COLUMN "icon" TEXT,
ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
