-- AlterTable
ALTER TABLE "Product" ADD COLUMN "condition" TEXT NOT NULL DEFAULT 'NEW';

-- SQLite versions bundled with local tooling support DROP COLUMN. If an older
-- SQLite engine is used, keep data safe and drop this column manually later.
ALTER TABLE "Product" DROP COLUMN "description";

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerDocument" TEXT,
    "customerAddress" TEXT,
    "totalUSD" REAL NOT NULL,
    "totalBs" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "productId" TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "productSkuSnapshot" TEXT,
    "productConditionSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceUSD" REAL NOT NULL,
    "unitPriceBs" REAL NOT NULL,
    "subtotalUSD" REAL NOT NULL,
    "subtotalBs" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");
