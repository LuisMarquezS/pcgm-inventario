-- AlterTable
ALTER TABLE "Product" ADD COLUMN "stockTienda" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "stockDeposito" INTEGER NOT NULL DEFAULT 0;

-- Existing databases only had total stock. Keep that stock visible in tienda
-- so products remain sellable until the team separates deposito/exhibicion.
UPDATE "Product"
SET "stockTienda" = "stock",
    "stockDeposito" = 0
WHERE "stockTienda" = 0 AND "stockDeposito" = 0 AND "stock" > 0;
