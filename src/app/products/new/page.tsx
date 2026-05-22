import { ProductForm } from "@/components/products/product-form";
import { prisma } from "@/lib/prisma";

export default async function NewProductPage() {
  const [categories, latestRate] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black text-white">Nuevo producto</h2>
        <p className="mt-1 text-slate-400">Carga rapida con vista previa de precios antes de guardar.</p>
      </div>
      <ProductForm categories={categories} latestRate={latestRate} />
    </div>
  );
}
