import { BarcodeProductCreator } from "@/components/products/barcode-product-creator";
import { prisma } from "@/lib/prisma";

export default async function NewProductByBarcodePage() {
  const [categories, latestRate] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black text-white">Agregar por codigo de barra</h2>
        <p className="mt-1 text-slate-400">Prueba UPCitemdb para prellenar datos y completa stock, categoria y precios antes de guardar.</p>
      </div>
      <BarcodeProductCreator categories={categories} latestRate={latestRate} />
    </div>
  );
}
