import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { prisma } from "@/lib/prisma";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, latestRate] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black text-white">Editar producto</h2>
        <p className="mt-1 text-slate-400">Ajusta stock, costos, foto o recalcula manualmente.</p>
      </div>
      <ProductForm product={product} categories={categories} latestRate={latestRate} />
    </div>
  );
}
