import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/sales/print-button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatBs, formatDate, formatUSD } from "@/lib/utils";

export default async function SaleNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!sale) notFound();

  return (
    <div className="grid gap-6">
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">Nota de entrega</h2>
          <p className="mt-1 text-slate-400">Lista para imprimir en papel blanco.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sales/history" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-white hover:bg-white/10">Historial</Link>
          <PrintButton />
        </div>
      </div>

      <Card className="print-note mx-auto w-full max-w-4xl bg-white p-8 text-slate-950">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black">PC Gamer Margarita</h1>
            <p className="text-sm text-slate-600">Nota de entrega</p>
          </div>
          <div className="text-right text-sm">
            <p><strong>Nota:</strong> {sale.saleNumber}</p>
            <p><strong>Fecha:</strong> {formatDate(sale.createdAt)}</p>
          </div>
        </header>

        <section className="grid gap-2 border-b border-slate-200 py-5 text-sm md:grid-cols-2">
          <p><strong>Cliente:</strong> {sale.customerName || "No indicado"}</p>
          <p><strong>Telefono:</strong> {sale.customerPhone || "No indicado"}</p>
          <p><strong>Cedula/RIF:</strong> {sale.customerDocument || "No indicado"}</p>
          <p><strong>Direccion:</strong> {sale.customerAddress || "No indicada"}</p>
        </section>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Cant.</th>
                <th className="p-3">Producto</th>
                <th className="p-3">Condicion</th>
                <th className="p-3 text-right">Unit. USD</th>
                <th className="p-3 text-right">Unit. Bs</th>
                <th className="p-3 text-right">Subtotal USD</th>
                <th className="p-3 text-right">Subtotal Bs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3"><strong>{item.productNameSnapshot}</strong><br /><span className="text-xs text-slate-500">{item.productSkuSnapshot ?? "Sin SKU"}</span></td>
                  <td className="p-3">{item.productConditionSnapshot === "REFURBISHED" ? "Refurbished" : "Nuevo"}</td>
                  <td className="p-3 text-right">{formatUSD(item.unitPriceUSD)}</td>
                  <td className="p-3 text-right">{formatBs(item.unitPriceBs)}</td>
                  <td className="p-3 text-right">{formatUSD(item.subtotalUSD)}</td>
                  <td className="p-3 text-right">{formatBs(item.subtotalBs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-6 ml-auto grid max-w-sm gap-2 rounded-lg bg-slate-100 p-4 text-sm">
          <div className="flex justify-between"><span>Total USD</span><strong>{formatUSD(sale.totalUSD)}</strong></div>
          <div className="flex justify-between"><span>Total Bs</span><strong>{formatBs(sale.totalBs)}</strong></div>
        </section>

        {sale.notes ? <p className="mt-6 text-sm"><strong>Notas:</strong> {sale.notes}</p> : null}

        <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-sm">
          <p className="font-semibold">Gracias por su compra</p>
          <p className="mt-1 text-xs text-slate-500">Documento no fiscal. Nota de entrega generada por PC Gamer Margarita.</p>
        </footer>
      </Card>
    </div>
  );
}
