import { AlertTriangle, Boxes, DollarSign, PackageX, Plus, ShoppingCart, Upload, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { formatBs, formatDate, formatNumber, formatUSD } from "@/lib/utils";
import type { Category, ExchangeRate, Product, Sale, SaleItem } from "@prisma/client";

type ProductWithCategory = Product & { category: Category | null };
type SaleWithItems = Sale & { items: SaleItem[] };

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

function salesTotal(sales: SaleWithItems[], from: Date) {
  const scoped = sales.filter((sale) => sale.createdAt >= from);
  return {
    usd: scoped.reduce((sum, sale) => sum + sale.totalUSD, 0),
    bs: scoped.reduce((sum, sale) => sum + sale.totalBs, 0),
    count: scoped.length,
  };
}

export function DashboardContent({
  products,
  latestRate,
  sales,
}: {
  products: ProductWithCategory[];
  latestRate: ExchangeRate | null;
  sales: SaleWithItems[];
}) {
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= product.minStock);
  const outOfStock = products.filter((product) => product.stock === 0);
  const totalCost = products.reduce((sum, product) => sum + product.costUSD * product.stock, 0);
  const totalSale = products.reduce((sum, product) => sum + product.adjustedSalePriceUSD * product.stock, 0);
  const todaySales = salesTotal(sales, startOfDay());
  const weekSales = salesTotal(sales, startOfWeek());
  const monthSales = salesTotal(sales, startOfMonth());
  const lastSale = sales[0];
  const bestSellers = Object.values(sales.flatMap((sale) => sale.items).reduce<Record<string, { name: string; quantity: number }>>((acc, item) => {
    acc[item.productNameSnapshot] ??= { name: item.productNameSnapshot, quantity: 0 };
    acc[item.productNameSnapshot].quantity += item.quantity;
    return acc;
  }, {})).sort((a, b) => b.quantity - a.quantity).slice(0, 4);
  const review = products.filter((product) => (
    product.stock === 0 ||
    product.stock <= product.minStock ||
    product.baseSalePriceUSD <= 0 ||
    !product.categoryId ||
    !product.imageUrl
  )).slice(0, 8);

  const cards = [
    { label: "Productos", value: totalProducts, icon: Boxes, accent: "text-cyan-200" },
    { label: "Unidades en stock", value: totalUnits, icon: Plus, accent: "text-lime-200" },
    { label: "Bajo stock", value: lowStock.length, icon: AlertTriangle, accent: "text-amber-200" },
    { label: "Agotados", value: outOfStock.length, icon: PackageX, accent: "text-fuchsia-200" },
    { label: "Costo inventario", value: formatUSD(totalCost), icon: DollarSign, accent: "text-cyan-200" },
    { label: "Venta estimada", value: formatUSD(totalSale), icon: WalletCards, accent: "text-lime-200" },
    { label: "Ventas hoy", value: formatUSD(todaySales.usd), icon: ShoppingCart, accent: "text-cyan-200" },
    { label: "Ventas semana", value: formatUSD(weekSales.usd), icon: ShoppingCart, accent: "text-lime-200" },
    { label: "Ventas mes", value: formatUSD(monthSales.usd), icon: ShoppingCart, accent: "text-fuchsia-200" },
  ];

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">Dashboard</h2>
          <p className="mt-1 text-slate-400">Vista rapida de stock, costos y precios para decidir sin abrir Excel.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/products/new"><Plus size={16} /> Nuevo producto</LinkButton>
          <LinkButton href="/import-export" variant="secondary"><Upload size={16} /> CSV</LinkButton>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <Card key={item.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
              </div>
              <item.icon className={item.accent} />
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr_1.35fr]">
        <Card>
          <h3 className="font-bold text-white">Tasas actuales</h3>
          <div className="mt-4 grid gap-3">
            <div className="flex justify-between gap-3 rounded-lg bg-white/5 p-3"><span>BCV</span><strong>{formatNumber(latestRate?.bcvRate, 4)}</strong></div>
            <div className="flex justify-between gap-3 rounded-lg bg-white/5 p-3"><span>Binance/USDT</span><strong>{formatNumber(latestRate?.parallelRate, 4)}</strong></div>
            <div className="flex justify-between gap-3 rounded-lg bg-white/5 p-3"><span>Fuente</span><Badge tone="cyan">{latestRate?.source ?? "Sin tasa"}</Badge></div>
            <p className="text-sm text-slate-400">Ultima actualizacion: {formatDate(latestRate?.createdAt)}</p>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-white">Resumen de ventas</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3 rounded-lg bg-white/5 p-3"><span>Hoy</span><strong>{todaySales.count} ventas / {formatBs(todaySales.bs)}</strong></div>
            <div className="flex justify-between gap-3 rounded-lg bg-white/5 p-3"><span>Semana</span><strong>{weekSales.count} ventas / {formatBs(weekSales.bs)}</strong></div>
            <div className="flex justify-between gap-3 rounded-lg bg-white/5 p-3"><span>Mes</span><strong>{monthSales.count} ventas / {formatBs(monthSales.bs)}</strong></div>
            <p className="text-slate-400">Ultima venta: {lastSale ? `${lastSale.saleNumber} - ${formatUSD(lastSale.totalUSD)}` : "Sin ventas"}</p>
            {bestSellers.length > 0 ? (
              <div className="grid gap-1 text-slate-300">
                <p className="font-semibold text-white">Mas vendidos</p>
                {bestSellers.map((item) => <span key={item.name}>{item.name}: {item.quantity}</span>)}
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-white">Productos que debes revisar</h3>
          <div className="mt-4 grid gap-3">
            {review.length === 0 ? <p className="text-sm text-slate-400">Todo se ve ordenado por ahora.</p> : null}
            {review.map((product) => (
              <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="font-semibold text-white">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.category?.name ?? "Sin categoria"} · Stock {product.stock} · {formatBs(product.salePriceBs)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.stock === 0 ? <Badge tone="red">Agotado</Badge> : null}
                  {product.stock > 0 && product.stock <= product.minStock ? <Badge tone="yellow">Bajo stock</Badge> : null}
                  {product.baseSalePriceUSD <= 0 ? <Badge tone="magenta">Sin precio</Badge> : null}
                  {!product.categoryId ? <Badge tone="muted">Sin categoria</Badge> : null}
                  {!product.imageUrl ? <Badge tone="muted">Sin foto</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
