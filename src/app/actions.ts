"use server";

import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculatePrices } from "@/lib/pricing";
import { parseImportCsv, parseProductActiveState, parseProductCondition, toCsv } from "@/lib/csv";
import { categorySchema } from "@/schemas/categorySchema";
import { exchangeRateSchema } from "@/schemas/exchangeRateSchema";
import { productSchema } from "@/schemas/productSchema";
import { saleSchema } from "@/schemas/saleSchema";
import { fetchCrystoDolarRates, saveRatesToDatabase } from "@/lib/exchange-rate-providers/crystoDolar";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : undefined;
}

export async function wipeDatabase(formData: FormData) {
  const confirmation = value(formData, "confirmation")?.trim();
  if (confirmation !== "BORRAR TODO") {
    return {
      ok: false,
      message: "Confirmacion incorrecta. Escribe BORRAR TODO para vaciar la base de datos.",
    };
  }

  const prismaDir = path.join(process.cwd(), "prisma");
  const dbPath = path.join(prismaDir, "dev.db");
  const backupDir = path.join(prismaDir, "backups");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `dev.backup-before-wipe-${stamp}.db`);

  await mkdir(backupDir, { recursive: true });
  await copyFile(dbPath, backupPath);

  await prisma.$transaction([
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.exchangeRate.deleteMany(),
    prisma.settings.deleteMany(),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/categories");
  revalidatePath("/exchange-rates");
  revalidatePath("/sales");
  revalidatePath("/settings");

  return {
    ok: true,
    message: "Base de datos vaciada correctamente.",
    backupPath,
  };
}

export async function createCategory(formData: FormData) {
  const data = categorySchema.parse({
    name: value(formData, "name")?.toUpperCase(),
    description: value(formData, "description"),
    isActive: value(formData, "isActive") === "on",
  });
  await prisma.category.create({ data });
  revalidatePath("/categories");
  return { ok: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const data = categorySchema.parse({
    name: value(formData, "name")?.toUpperCase(),
    description: value(formData, "description"),
    isActive: value(formData, "isActive") === "on",
  });
  await prisma.category.update({ where: { id }, data });
  revalidatePath("/categories");
  return { ok: true };
}

export async function deleteOrDeactivateCategory(id: string) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return {
      ok: false,
      message: "Esta categoria tiene productos asociados. Puedes desactivarla, pero no eliminarla.",
    };
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  return { ok: true };
}

export async function saveManualRates(formData: FormData) {
  const data = exchangeRateSchema.parse({
    bcvRate: value(formData, "bcvRate"),
    parallelRate: value(formData, "parallelRate"),
    source: "Manual",
    notes: value(formData, "notes"),
  });
  await prisma.exchangeRate.create({ data });
  revalidatePath("/exchange-rates");
  revalidatePath("/dashboard");
}

export async function updateFromCrystoDolar() {
  const settings = await prisma.settings.findFirst();
  const rates = await fetchCrystoDolarRates(settings?.rateFetchCooldownMinutes ?? 60);
  if (rates.source === "CrystoDolar") {
    const saved = await saveRatesToDatabase(rates);
    revalidatePath("/exchange-rates");
    revalidatePath("/dashboard");
    return {
      ok: true,
      saved: true,
      message: "Tasas actualizadas desde CrystoDolar.",
      rateId: saved.id,
      rates,
    };
  }
  revalidatePath("/exchange-rates");
  revalidatePath("/dashboard");
  return {
    ok: false,
    saved: false,
    message: "No pudimos obtener tasas nuevas desde CrystoDolar. Se mantiene la ultima tasa guardada.",
    rates,
  };
}

export async function saveProduct(id: string | undefined, formData: FormData) {
  const parsed = productSchema.parse({
    sku: value(formData, "sku"),
    barcode: value(formData, "barcode"),
    name: value(formData, "name"),
    brand: value(formData, "brand"),
    model: value(formData, "model"),
    condition: value(formData, "condition") || "NEW",
    imageUrl: value(formData, "imageUrl"),
    stockTienda: value(formData, "stockTienda"),
    stockDeposito: value(formData, "stockDeposito"),
    stockAlmacenExterno: value(formData, "stockAlmacenExterno"),
    minStock: value(formData, "minStock"),
    costUSD: value(formData, "costUSD"),
    baseSalePriceUSD: value(formData, "baseSalePriceUSD"),
    bcvRate: value(formData, "bcvRate"),
    parallelRate: value(formData, "parallelRate"),
    categoryId: value(formData, "categoryId"),
    isActive: value(formData, "isActive") !== "false",
  });
  const prices = calculatePrices(parsed);
  const data = {
    sku: parsed.sku || null,
    barcode: parsed.barcode || null,
    name: parsed.name,
    brand: parsed.brand || null,
    model: parsed.model || null,
    condition: parsed.condition,
    imageUrl: parsed.imageUrl || null,
    stock: parsed.stockTienda + parsed.stockDeposito + parsed.stockAlmacenExterno,
    stockTienda: parsed.stockTienda,
    stockDeposito: parsed.stockDeposito,
    stockAlmacenExterno: parsed.stockAlmacenExterno,
    minStock: parsed.minStock,
    costUSD: parsed.costUSD,
    baseSalePriceUSD: parsed.baseSalePriceUSD,
    adjustedSalePriceUSD: prices.adjustedSalePriceUSD,
    salePriceBs: prices.salePriceBs,
    profitUSD: prices.profitUSD,
    profitMarginPercent: prices.profitMarginPercent,
    lastBCVRate: parsed.bcvRate,
    lastParallelRate: parsed.parallelRate,
    category: { connect: { id: parsed.categoryId } },
    isActive: parsed.isActive,
  };

  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    await prisma.product.create({ data });
  }
  revalidatePath("/products");
  revalidatePath("/dashboard");
  redirect("/products");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function recalculateProduct(id: string) {
  const [product, rate] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);
  if (!product || !rate) return;
  const prices = calculatePrices({
    costUSD: product.costUSD,
    baseSalePriceUSD: product.baseSalePriceUSD,
    bcvRate: rate.bcvRate,
    parallelRate: rate.parallelRate,
  });
  await prisma.product.update({
    where: { id },
    data: {
      ...prices,
      lastBCVRate: rate.bcvRate,
      lastParallelRate: rate.parallelRate,
    },
  });
  revalidatePath("/products");
}

export async function recalculateAllProducts() {
  const [products, rate] = await Promise.all([
    prisma.product.findMany(),
    prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);
  if (!rate) return;
  for (const product of products) {
    const prices = calculatePrices({
      costUSD: product.costUSD,
      baseSalePriceUSD: product.baseSalePriceUSD,
      bcvRate: rate.bcvRate,
      parallelRate: rate.parallelRate,
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { ...prices, lastBCVRate: rate.bcvRate, lastParallelRate: rate.parallelRate },
    });
  }
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function importProductsFromCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) return;
  const parsed = parseImportCsv(await file.text());
  const latestRate = await prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } });
  const bcvRate = latestRate?.bcvRate ?? 1;
  const parallelRate = latestRate?.parallelRate ?? 1;
  let imported = 0;
  let errors = 0;
  let categoriesCreated = 0;

  for (const row of parsed.data) {
    try {
      if (!row.nombre) {
        errors++;
        continue;
      }
      const categoryName = (row.categoria || "OTROS").trim().toUpperCase();
      let category = await prisma.category.findUnique({ where: { name: categoryName } });
      if (!category) {
        category = await prisma.category.create({ data: { name: categoryName } });
        categoriesCreated++;
      }
      const costUSD = Number(row.costoUSD ?? 0);
      const baseSalePriceUSD = Number(row.precioVentaBaseUSD ?? 0);
      const condition = parseProductCondition(row.condicion);
      if (!condition) {
        errors++;
        continue;
      }
      const isActive = parseProductActiveState(row.estado);
      if (isActive === null) {
        errors++;
        continue;
      }
      const stockTienda = Number(row.stockTienda ?? row.tienda ?? row.t ?? row.stock ?? 0);
      const stockDeposito = Number(row.stockDeposito ?? row.deposito ?? row.d ?? 0);
      const stockAlmacenExterno = Number(row.stockAlmacenExterno ?? row.almacenExterno ?? row.almacen ?? row.externo ?? 0);
      const prices = calculatePrices({ costUSD, baseSalePriceUSD, bcvRate, parallelRate });
      await prisma.product.create({
        data: {
          name: row.nombre,
          brand: row.marca || null,
          model: row.modelo || null,
          sku: row.sku || null,
          barcode: row.barcode || row.codigoBarra || row.codigoDeBarra || row.codigoBarras || row.codigoDeBarras || row.upc || row.ean || null,
          category: { connect: { id: category.id } },
          condition,
          isActive,
          stock: stockTienda + stockDeposito + stockAlmacenExterno,
          stockTienda,
          stockDeposito,
          stockAlmacenExterno,
          minStock: Number(row.stockMinimo ?? 0),
          costUSD,
          baseSalePriceUSD,
          ...prices,
          lastBCVRate: bcvRate,
          lastParallelRate: parallelRate,
        },
      });
      imported++;
    } catch {
      errors++;
    }
  }
  revalidatePath("/products");
  redirect(`/import-export?imported=${imported}&errors=${errors}&categories=${categoriesCreated}`);
}

export async function updateSettings(formData: FormData) {
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      storeName: value(formData, "storeName") || "PC Gamer Margarita",
      defaultCurrency: value(formData, "defaultCurrency") || "USD",
      lowStockEnabled: value(formData, "lowStockEnabled") === "on",
      autoFetchRatesEnabled: value(formData, "autoFetchRatesEnabled") === "on",
      rateFetchCooldownMinutes: Number(value(formData, "rateFetchCooldownMinutes") ?? 60),
    },
    create: {
      id: "default",
      storeName: value(formData, "storeName") || "PC Gamer Margarita",
      defaultCurrency: value(formData, "defaultCurrency") || "USD",
      lowStockEnabled: value(formData, "lowStockEnabled") === "on",
      autoFetchRatesEnabled: value(formData, "autoFetchRatesEnabled") === "on",
      rateFetchCooldownMinutes: Number(value(formData, "rateFetchCooldownMinutes") ?? 60),
    },
  });
  revalidatePath("/settings");
}

export async function exportInventoryCsv() {
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } });
  return toCsv(products.map((product) => ({
    ID: product.id,
    SKU: product.sku,
    "Codigo de barra": product.barcode,
    Nombre: product.name,
    Marca: product.brand,
    Modelo: product.model,
    Condicion: product.condition === "REFURBISHED" ? "Refurbished" : "Nuevo",
    Categoria: product.category?.name,
    "Stock actual": product.stock,
    "Stock tienda": product.stockTienda,
    "Stock deposito": product.stockDeposito,
    "Stock almacen externo": product.stockAlmacenExterno,
    "Stock minimo": product.minStock,
    "Costo USD": product.costUSD,
    "Precio base USD": product.baseSalePriceUSD,
    "Precio ajustado USD": product.adjustedSalePriceUSD,
    "Precio Bs": product.salePriceBs,
    "Tasa BCV usada": product.lastBCVRate,
    "Tasa Binance usada": product.lastParallelRate,
    "Ganancia USD": product.profitUSD,
    "Margen %": product.profitMarginPercent,
    Estado: product.isActive ? "Activo" : "Inactivo",
    "Fecha de creacion": product.createdAt.toISOString(),
    "Ultima actualizacion": product.updatedAt.toISOString(),
  })));
}

export async function finishSale(input: unknown) {
  const parsed = saleSchema.parse(input);

  const sale = await prisma.$transaction(async (tx) => {
    const ids = parsed.items.map((item) => item.productId);
    const products = await tx.product.findMany({ where: { id: { in: ids } } });
    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of parsed.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error("Un producto del carrito ya no existe.");
      if (!product.isActive) throw new Error(`${product.name} esta inactivo y no se puede vender.`);
      if (product.stock < item.quantity) throw new Error(`${product.name} no tiene stock suficiente. Disponible: ${product.stock}.`);
    }

    const totalUSD = parsed.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + product.adjustedSalePriceUSD * item.quantity;
    }, 0);
    const totalBs = parsed.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + product.salePriceBs * item.quantity;
    }, 0);
    const count = await tx.sale.count();
    const saleNumber = `NE-${String(count + 1).padStart(6, "0")}`;

    const created = await tx.sale.create({
      data: {
        saleNumber,
        customerName: parsed.customerName || null,
        customerPhone: parsed.customerPhone || null,
        customerDocument: parsed.customerDocument || null,
        customerAddress: parsed.customerAddress || null,
        notes: parsed.notes || null,
        totalUSD: Math.round(totalUSD * 100) / 100,
        totalBs: Math.round(totalBs * 100) / 100,
        items: {
          create: parsed.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: product.id,
              productNameSnapshot: product.name,
              productSkuSnapshot: product.sku,
              productConditionSnapshot: product.condition,
              quantity: item.quantity,
              unitPriceUSD: product.adjustedSalePriceUSD,
              unitPriceBs: product.salePriceBs,
              subtotalUSD: Math.round(product.adjustedSalePriceUSD * item.quantity * 100) / 100,
              subtotalBs: Math.round(product.salePriceBs * item.quantity * 100) / 100,
            };
          }),
        },
      },
    });

    for (const item of parsed.items) {
      const product = productMap.get(item.productId)!;
      const fromStore = Math.min(product.stockTienda, item.quantity);
      const remainingAfterStore = item.quantity - fromStore;
      const fromWarehouse = Math.min(product.stockDeposito, remainingAfterStore);
      const fromExternalWarehouse = remainingAfterStore - fromWarehouse;
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          stockTienda: { decrement: fromStore },
          stockDeposito: { decrement: fromWarehouse },
          stockAlmacenExterno: { decrement: fromExternalWarehouse },
        },
      });
    }

    return created;
  });

  revalidatePath("/sales");
  revalidatePath("/sales/history");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { ok: true, saleId: sale.id, saleNumber: sale.saleNumber };
}
