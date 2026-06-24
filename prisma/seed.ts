import { PrismaClient } from "@prisma/client";
import { calculatePrices } from "../src/lib/pricing";

const prisma = new PrismaClient();

const categories = [
  "MOBO",
  "GPU",
  "CPU",
  "PSU",
  "MONITOR",
  "CASE",
  "MOUSE",
  "TECLADO",
  "RAM",
  "SSD",
  "HDD",
  "CONSOLA",
  "CONTROL",
  "SILLA GAMER",
  "AUDIFONOS",
  "ACCESORIOS",
  "CABLES",
  "STREAMING",
  "COOLING",
  "OTROS",
];

async function main() {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description: `Categoria ${name}` },
    });
  }

  const bcvRate = 526.8694;
  const parallelRate = 714.899;

  await prisma.exchangeRate.create({
    data: {
      bcvRate,
      parallelRate,
      source: "Manual",
      notes: "Datos de ejemplo basados en captura inicial, modificables por el usuario.",
    },
  });

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "PC Gamer Margarita",
      defaultCurrency: "USD",
      lowStockEnabled: true,
      autoFetchRatesEnabled: false,
      rateFetchCooldownMinutes: 60,
    },
  });

  const gpu = await prisma.category.findUnique({ where: { name: "GPU" } });
  const mouse = await prisma.category.findUnique({ where: { name: "MOUSE" } });
  const ssd = await prisma.category.findUnique({ where: { name: "SSD" } });

  const examples = [
    {
      sku: "GPU-RTX3060-12G",
      name: "Tarjeta grafica RTX 3060 12GB",
      brand: "NVIDIA",
      model: "RTX 3060 12GB",
      condition: "NEW",
      stock: 2,
      stockTienda: 1,
      stockDeposito: 1,
      minStock: 1,
      costUSD: 230,
      baseSalePriceUSD: 320,
      categoryId: gpu?.id,
    },
    {
      sku: "MOU-G203",
      name: "Mouse Logitech G203",
      brand: "Logitech",
      model: "G203",
      condition: "NEW",
      stock: 8,
      stockTienda: 5,
      stockDeposito: 3,
      minStock: 3,
      costUSD: 18,
      baseSalePriceUSD: 30,
      categoryId: mouse?.id,
    },
    {
      sku: "SSD-K1TB-NVME",
      name: "SSD Kingston 1TB NVMe",
      brand: "Kingston",
      model: "NV2 1TB",
      condition: "NEW",
      stock: 0,
      stockTienda: 0,
      stockDeposito: 0,
      minStock: 2,
      costUSD: 48,
      baseSalePriceUSD: 70,
      categoryId: ssd?.id,
    },
  ];

  for (const product of examples) {
    const prices = calculatePrices({
      costUSD: product.costUSD,
      baseSalePriceUSD: product.baseSalePriceUSD,
      bcvRate,
      parallelRate,
    });

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...product,
        adjustedSalePriceUSD: prices.adjustedSalePriceUSD,
        salePriceBs: prices.salePriceBs,
        lastBCVRate: bcvRate,
        lastParallelRate: parallelRate,
        profitUSD: prices.profitUSD,
        profitMarginPercent: prices.profitMarginPercent,
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
