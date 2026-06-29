-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_product_variants
-- Adds ProductVariant model & ProductUnit enum.
-- Migrates existing product price/stock/sku/weight → default variant per product.
-- Updates transaction models with variantId + snapshot fields.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the ProductUnit enum
DO $$ BEGIN
    CREATE TYPE "ProductUnit" AS ENUM ('GRAM', 'KILOGRAM', 'MILLILITRE', 'LITRE', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create product_variants table
CREATE TABLE IF NOT EXISTS "product_variants" (
    "id"             TEXT NOT NULL,
    "productId"      TEXT NOT NULL,
    "sku"            TEXT,
    "variantName"    TEXT NOT NULL,
    "quantityValue"  DECIMAL(10,3) NOT NULL,
    "unit"           "ProductUnit" NOT NULL DEFAULT 'GRAM',
    "customUnit"     TEXT,
    "sellingPrice"   DECIMAL(10,2) NOT NULL,
    "costPrice"      DECIMAL(10,2),
    "stock"          INTEGER NOT NULL DEFAULT 0,
    "shippingWeight" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "barcode"        TEXT,
    "active"         BOOLEAN NOT NULL DEFAULT true,
    "isDefault"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- 3. Create indexes & constraints for product_variants
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_key" ON "product_variants"("sku");
CREATE INDEX IF NOT EXISTS "product_variants_productId_idx" ON "product_variants"("productId");
CREATE INDEX IF NOT EXISTS "product_variants_sku_idx" ON "product_variants"("sku");

-- FK: product_variants → products
DO $$ BEGIN
    ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Migrate existing product data → one default variant per product
--    Uses the product's current price, stock, sku, weight, costPrice
INSERT INTO "product_variants" (
    "id", "productId", "sku", "variantName",
    "quantityValue", "unit", "sellingPrice", "costPrice",
    "stock", "shippingWeight", "active", "isDefault",
    "createdAt", "updatedAt"
)
SELECT
    -- Generate a cuid-like id by combining text
    'mig_' || replace(p."id", '-', '') AS "id",
    p."id" AS "productId",
    p."sku" AS "sku",
    -- Build variant name from weight or default to product name
    CASE
        WHEN p."weight" IS NOT NULL AND p."weight" != '' THEN p."weight"
        ELSE '1 unit'
    END AS "variantName",
    -- Parse quantityValue: extract leading number from weight string
    CASE
        WHEN p."weight" ~ '^[0-9]+(\.[0-9]+)?' THEN
            CAST(regexp_replace(p."weight", '^([0-9]+(\.[0-9]+)?).*', '\1') AS DECIMAL(10,3))
        ELSE 1
    END AS "quantityValue",
    -- Parse unit from weight string
    CASE
        WHEN lower(p."weight") LIKE '%kg%' OR lower(p."weight") LIKE '%kilogram%' THEN 'KILOGRAM'::"ProductUnit"
        WHEN lower(p."weight") LIKE '% g%' OR lower(p."weight") LIKE '%gram%' OR lower(p."weight") LIKE '%gm%' THEN 'GRAM'::"ProductUnit"
        WHEN lower(p."weight") LIKE '%ml%' OR lower(p."weight") LIKE '%millilitre%' OR lower(p."weight") LIKE '%milliliter%' THEN 'MILLILITRE'::"ProductUnit"
        WHEN lower(p."weight") LIKE '%litre%' OR lower(p."weight") LIKE '%liter%' OR lower(p."weight") LIKE '% l%' THEN 'LITRE'::"ProductUnit"
        ELSE 'CUSTOM'::"ProductUnit"
    END AS "unit",
    COALESCE(p."price", 0) AS "sellingPrice",
    p."costPrice" AS "costPrice",
    COALESCE(p."stock", 0) AS "stock",
    -- Shipping weight in kg: parse from weight string
    CASE
        WHEN p."weight" ~ '^[0-9]+(\.[0-9]+)?\s*(kg|kilogram)' THEN
            CAST(regexp_replace(p."weight", '^([0-9]+(\.[0-9]+)?).*', '\1') AS DECIMAL(10,3))
        WHEN p."weight" ~ '^[0-9]+(\.[0-9]+)?\s*(g|gram|gm)' THEN
            CAST(regexp_replace(p."weight", '^([0-9]+(\.[0-9]+)?).*', '\1') AS DECIMAL(10,3)) / 1000
        WHEN p."weight" ~ '^[0-9]+(\.[0-9]+)?\s*(ml|millilitre|milliliter)' THEN
            CAST(regexp_replace(p."weight", '^([0-9]+(\.[0-9]+)?).*', '\1') AS DECIMAL(10,3)) / 1000
        WHEN p."weight" ~ '^[0-9]+(\.[0-9]+)?\s*(l|litre|liter)' THEN
            CAST(regexp_replace(p."weight", '^([0-9]+(\.[0-9]+)?).*', '\1') AS DECIMAL(10,3))
        ELSE 1
    END AS "shippingWeight",
    p."createdAt" AS "createdAt",
    p."updatedAt" AS "updatedAt"
FROM "products" p
WHERE NOT EXISTS (
    SELECT 1 FROM "product_variants" pv WHERE pv."productId" = p."id"
);

-- 5. Add variantId to order_items + snapshot columns
ALTER TABLE "order_items"
    ADD COLUMN IF NOT EXISTS "variantId"             TEXT,
    ADD COLUMN IF NOT EXISTS "variantNameSnapshot"   TEXT,
    ADD COLUMN IF NOT EXISTS "quantityValueSnapshot" DECIMAL(10,3),
    ADD COLUMN IF NOT EXISTS "unitSnapshot"          TEXT,
    ADD COLUMN IF NOT EXISTS "customUnitSnapshot"    TEXT,
    ADD COLUMN IF NOT EXISTS "skuSnapshot"           TEXT;

DO $$ BEGIN
    ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. Add variantId to invoice_items + snapshot columns
ALTER TABLE "invoice_items"
    ADD COLUMN IF NOT EXISTS "variantId"             TEXT,
    ADD COLUMN IF NOT EXISTS "variantNameSnapshot"   TEXT,
    ADD COLUMN IF NOT EXISTS "quantityValueSnapshot" DECIMAL(10,3),
    ADD COLUMN IF NOT EXISTS "unitSnapshot"          TEXT,
    ADD COLUMN IF NOT EXISTS "customUnitSnapshot"    TEXT;

DO $$ BEGIN
    ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "invoice_items_variantId_idx" ON "invoice_items"("variantId");

-- 7. Add variantId to purchase_order_items + snapshot columns
ALTER TABLE "purchase_order_items"
    ADD COLUMN IF NOT EXISTS "variantId"           TEXT,
    ADD COLUMN IF NOT EXISTS "variantNameSnapshot" TEXT;

DO $$ BEGIN
    ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "purchase_order_items_variantId_idx" ON "purchase_order_items"("variantId");

-- 8. Add variantId to inventory_movements
ALTER TABLE "inventory_movements"
    ADD COLUMN IF NOT EXISTS "variantId" TEXT;

DO $$ BEGIN
    ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "inventory_movements_variantId_idx" ON "inventory_movements"("variantId");

-- 9. Drop legacy columns from products that now live on product_variants
--    (do this LAST, after migration is complete)
ALTER TABLE "products"
    DROP COLUMN IF EXISTS "price",
    DROP COLUMN IF EXISTS "discountedPrice",
    DROP COLUMN IF EXISTS "stock",
    DROP COLUMN IF EXISTS "costPrice",
    DROP COLUMN IF EXISTS "averageCostPrice",
    DROP COLUMN IF EXISTS "lastPurchasePrice",
    DROP COLUMN IF EXISTS "minimumStockLevel",
    DROP COLUMN IF EXISTS "sku",
    DROP COLUMN IF EXISTS "unit",
    DROP COLUMN IF EXISTS "weight";
