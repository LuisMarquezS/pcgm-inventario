ALTER TABLE "Product" ADD COLUMN "barcode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Product_barcode_key" ON "Product"("barcode");
CREATE INDEX IF NOT EXISTS "Product_barcode_idx" ON "Product"("barcode");
