import Link from "next/link";
import { Eye, Printer, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { prisma } from "@/lib/prisma";
import { formatBs, formatDate, formatUSD } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date = new Date()) {
  const day = date.getDay() || 7;
  const start = startOfDay(date);
  start.setDate(start.getDate() - day + 1);
  return start;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sumSales(sales: { totalUSD: number; totalBs: number; items: { quantity: number }[] }[]) {
  return sales.reduce((acc, sale) => {
    acc.usd += sale.totalUSD;
    acc.bs += sale.totalBs;
    acc.count += 1;
    acc.products += sale.items.reduce((sum, item) => sum + item.quantity, 0);
    return acc;
  }, { usd: 0, bs: 0, count: 0, products: 0 });
}

export default async function SalesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = String(params.q ?? "");
  const period = String(params.period ?? "mes");
  const from = String(params.from ?? "");
  const to = String(params.to ?? "");
  const today = startOfDay();
  const week = startOfWeek();
  const month = startOfMonth();

  const allRecent = await prisma.sale.findMany({
    include: { items: true },
    where: { createdAt: { gte: month } },
    orderBy: { createdAt: "desc" },
  });

  const dateFilter =
    period === "hoy" ? { gte: today } :
    period === "semana" ? { gte: week } :
    period === "rango" && from ? { gte: new Date(`${from}T00:00:00`), ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}) } :
    { gte: month };

  const sales = await prisma.sale.findMany({
    include: { items: true },
    where: {
      AND: [
        { createdAt: dateFilter },
        q ? {
          OR: [
            { saleNumber: { contains: q } },
            { customerName: { contains: q } },
            { customerPhone: { contains: q } },
            { customerDocument: { contains: q } },
          ],
        } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const todayMetrics = sumSales(allRecent.filter((sale) => sale.createdAt >= today));
  const weekMetrics = sumSales(allRecent.filter((sale) => sale.createdAt >= week));
  const monthMetrics = sumSales(allRecent);

  const cards = [
    { label: "Ventas hoy USD", value: formatUSD(todayMetrics.usd), sub: `${todayMetrics.count} ventas` },
    { label: "Ventas hoy Bs", value: formatBs(todayMetrics.bs), sub: `${todayMetrics.products} productos` },
    { label: "Semana USD", value: formatUSD(weekMetrics.usd), sub: `${weekMetrics.count} ventas` },
    { label: "Semana Bs", value: formatBs(weekMetrics.bs), sub: `${weekMetrics.products} productos` },
    { label: "Mes USD", value: formatUSD(monthMetrics.usd), sub: `${monthMetrics.count} ventas` },
    { label: "Mes Bs", value: formatBs(monthMetrics.bs), sub: `${monthMetrics.products} productos` },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black text-white">Ventas</h2>
        <p className="mt-1 text-slate-400">Metricas e historial. El carrito se abre desde la barra superior.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{card.value}</p>
                <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
              </div>
              <TrendingUp className="text-cyan-200" />
            </div>
          </Card>
        ))}
      </section>

      <Card>
        <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px_auto]">
          <Input name="q" defaultValue={q} placeholder="Buscar por venta, cliente, telefono..." />
          <Select name="period" defaultValue={period}>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="rango">Rango</option>
          </Select>
          <Input name="from" type="date" defaultValue={from} />
          <Input name="to" type="date" defaultValue={to} />
          <button className="rounded-lg bg-cyan-400 px-4 text-sm font-bold text-slate-950">Filtrar</button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Venta</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Total USD</th>
              <th className="px-4 py-3">Total Bs</th>
              <th className="w-32 px-4 py-3">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-4 py-3"><Badge tone="cyan">{sale.saleNumber}</Badge></td>
                <td className="px-4 py-3">{formatDate(sale.createdAt)}</td>
                <td className="px-4 py-3">{sale.customerName || "Sin cliente"}</td>
                <td className="px-4 py-3">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="px-4 py-3">{formatUSD(sale.totalUSD)}</td>
                <td className="px-4 py-3 text-lime-200">{formatBs(sale.totalBs)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/sales/${sale.id}`} className="inline-grid size-8 place-items-center rounded-lg border border-white/10 text-white hover:bg-white/10" aria-label="Ver nota" title="Ver nota"><Eye size={15} /></Link>
                    <Link href={`/sales/${sale.id}`} className="inline-grid size-8 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/16" aria-label="Imprimir nota" title="Imprimir nota"><Printer size={15} /></Link>
                  </div>
                </td>
              </tr>
            ))}
            {sales.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No hay ventas para este filtro.</td></tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
