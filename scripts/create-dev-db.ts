import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const migrationPath = path.join(process.cwd(), "prisma", "migrations", "20260522124000_init", "migration.sql");

mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);
const migration = readFileSync(migrationPath, "utf8");

const incrementalStatements = [
  `ALTER TABLE "Product" ADD COLUMN "condition" TEXT NOT NULL DEFAULT 'NEW'`,
  `ALTER TABLE "Product" ADD COLUMN "barcode" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Product_barcode_key" ON "Product"("barcode")`,
  `CREATE INDEX IF NOT EXISTS "Product_barcode_idx" ON "Product"("barcode")`,
  `ALTER TABLE "Product" ADD COLUMN "stockTienda" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Product" ADD COLUMN "stockDeposito" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Product" ADD COLUMN "stockAlmacenExterno" INTEGER NOT NULL DEFAULT 0`,
  `UPDATE "Product" SET "stockTienda" = "stock", "stockDeposito" = 0 WHERE "stockTienda" = 0 AND "stockDeposito" = 0 AND "stock" > 0`,
  `UPDATE "Product" SET "stock" = "stockTienda" + "stockDeposito" + "stockAlmacenExterno"`,
  `ALTER TABLE "Product" DROP COLUMN "description"`,
  `CREATE TABLE IF NOT EXISTS "Sale" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "SaleItem" (
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
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Sale_saleNumber_key" ON "Sale"("saleNumber")`,
  `CREATE INDEX IF NOT EXISTS "SaleItem_saleId_idx" ON "SaleItem"("saleId")`,
  `CREATE INDEX IF NOT EXISTS "SaleItem_productId_idx" ON "SaleItem"("productId")`,
];

db.exec(migration, (error) => {
  if (error && !String(error.message).includes("already exists")) {
    console.error(error);
    process.exit(1);
  }
  db.serialize(() => {
    for (const statement of incrementalStatements) {
      db.run(statement, (statementError) => {
        if (
          statementError &&
          !String(statementError.message).includes("duplicate column") &&
          !String(statementError.message).includes("no such column")
        ) {
          console.warn(statementError.message);
        }
      });
    }
    db.close(() => console.log(`SQLite database ready at ${dbPath}`));
  });
});
