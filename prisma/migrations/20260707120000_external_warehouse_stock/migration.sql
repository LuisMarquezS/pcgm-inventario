ALTER TABLE "Product" ADD COLUMN "stockAlmacenExterno" INTEGER NOT NULL DEFAULT 0;

UPDATE "Product"
SET "stock" = "stockTienda" + "stockDeposito" + "stockAlmacenExterno";
