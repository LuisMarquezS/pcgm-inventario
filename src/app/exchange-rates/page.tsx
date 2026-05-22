import { Save } from "lucide-react";
import { saveManualRates } from "@/app/actions";
import { CrystoUpdateButton } from "@/components/exchange-rates/crysto-update-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function ExchangeRatesPage() {
  const rates = await prisma.exchangeRate.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  const latest = rates[0];

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black text-white">Tasas de cambio</h2>
        <p className="mt-1 text-slate-400">Manual primero, automatico opcional y tolerante a fallos.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h3 className="font-bold text-white">Tasa actual</h3>
          <div className="mt-4 grid gap-3">
            <div className="flex justify-between rounded-lg bg-white/5 p-3"><span>BCV</span><strong>{formatNumber(latest?.bcvRate, 4)}</strong></div>
            <div className="flex justify-between rounded-lg bg-white/5 p-3"><span>Binance USDT</span><strong>{formatNumber(latest?.parallelRate, 4)}</strong></div>
            <div className="flex justify-between rounded-lg bg-white/5 p-3"><span>Fuente</span><Badge tone="cyan">{latest?.source ?? "Sin tasa"}</Badge></div>
            <p className="text-sm text-slate-400">Actualizada: {formatDate(latest?.createdAt)}</p>
          </div>
        </Card>

        <Card>
          <form action={saveManualRates} className="grid gap-4 md:grid-cols-2">
            <Field label="BCV actual">
              <Input name="bcvRate" type="number" step="0.0001" min="0.0001" defaultValue={latest?.bcvRate ?? 526.8694} required />
            </Field>
            <Field label="Binance/USDT actual">
              <Input name="parallelRate" type="number" step="0.0001" min="0.0001" defaultValue={latest?.parallelRate ?? 714.899} required />
            </Field>
            <Field label="Notas">
              <Input name="notes" placeholder="Ej. tasa del cierre de hoy" />
            </Field>
            <div className="flex items-end">
              <Button type="submit" className="w-full"><Save size={16} /> Guardar tasas manualmente</Button>
            </div>
          </form>
          <div className="mt-4">
            <CrystoUpdateButton />
          </div>
          <p className="mt-3 text-sm text-slate-400">Si la actualizacion automatica falla: No pudimos actualizar las tasas automaticamente. Puedes ingresarlas manualmente o usar la ultima tasa guardada.</p>
        </Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">BCV</th><th className="px-4 py-3">Binance</th><th className="px-4 py-3">Fuente</th><th className="px-4 py-3">Notas</th></tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rates.map((rate) => (
              <tr key={rate.id}>
                <td className="px-4 py-3">{formatDate(rate.createdAt)}</td>
                <td className="px-4 py-3">{formatNumber(rate.bcvRate, 4)}</td>
                <td className="px-4 py-3">{formatNumber(rate.parallelRate, 4)}</td>
                <td className="px-4 py-3"><Badge tone={rate.source === "Manual" ? "green" : "cyan"}>{rate.source}</Badge></td>
                <td className="px-4 py-3 text-slate-400">{rate.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
