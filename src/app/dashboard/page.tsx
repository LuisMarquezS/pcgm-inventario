import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [products, latestRate] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } }),
    prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);
  const sales = await prisma.sale.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return <DashboardContent products={products} latestRate={latestRate} sales={sales} />;
}
