-- AlterTable
ALTER TABLE "Franchise" ADD COLUMN "billPrefix" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Franchise" ADD COLUMN "nextBillSeq" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "billNo" TEXT NOT NULL DEFAULT '';

-- Backfill bill prefixes from franchise names (first 3 letters, uppercase)
UPDATE "Franchise"
SET "billPrefix" = UPPER(SUBSTRING(REGEXP_REPLACE("name", '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 3))
WHERE "billPrefix" = '' OR "billPrefix" IS NULL;

UPDATE "Franchise" SET "billPrefix" = 'BL' WHERE "billPrefix" = '' OR LENGTH("billPrefix") < 2;

-- Resolve duplicate prefixes by appending id suffix
UPDATE "Franchise" f
SET "billPrefix" = LEFT(f."billPrefix", 6) || SUBSTRING(f."id" FROM 1 FOR 2)
WHERE f."id" IN (
  SELECT f2."id" FROM "Franchise" f2
  WHERE (SELECT COUNT(*) FROM "Franchise" f3 WHERE f3."billPrefix" = f2."billPrefix") > 1
);

-- Assign sequential bill numbers per franchise for existing orders
WITH numbered AS (
  SELECT
    o."id",
    f."billPrefix",
    ROW_NUMBER() OVER (PARTITION BY o."franchiseId" ORDER BY o."createdAt" ASC) AS seq
  FROM "Order" o
  JOIN "Franchise" f ON f."id" = o."franchiseId"
)
UPDATE "Order" o
SET "billNo" = n."billPrefix" || LPAD(n.seq::text, 2, '0')
FROM numbered n
WHERE o."id" = n."id" AND (o."billNo" = '' OR o."billNo" IS NULL);

-- Update next sequence counters
UPDATE "Franchise" f
SET "nextBillSeq" = COALESCE((
  SELECT MAX(
    CASE
      WHEN o."billNo" ~ ('^' || f."billPrefix" || '[0-9]+$')
      THEN NULLIF(REGEXP_REPLACE(o."billNo", '^' || f."billPrefix", ''), '')::INTEGER
      ELSE 0
    END
  ) + 1
  FROM "Order" o
  WHERE o."franchiseId" = f."id"
), 1);

-- Unique constraints (empty billNo only allowed once per franchise — should not occur after backfill)
CREATE UNIQUE INDEX "Franchise_billPrefix_key" ON "Franchise"("billPrefix") WHERE "billPrefix" <> '';
CREATE UNIQUE INDEX "Order_franchiseId_billNo_key" ON "Order"("franchiseId", "billNo") WHERE "billNo" <> '';
