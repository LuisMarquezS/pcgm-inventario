import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } });
  const csv = toCsv(products.map((product) => ({
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

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=inventario-pc-gamer-margarita.csv",
    },
  });
}
