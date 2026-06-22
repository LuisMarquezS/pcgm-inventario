import { Save } from "lucide-react";
import { updateSettings } from "@/app/actions";
import { DangerZone } from "@/components/settings/danger-zone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const settings = await prisma.settings.findFirst();

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black text-white">Configuracion</h2>
        <p className="mt-1 text-slate-400">Ajustes locales de tienda, tasas y respaldos.</p>
      </div>
      <Card>
        <form action={updateSettings} className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre de la tienda">
            <Input name="storeName" defaultValue={settings?.storeName ?? "PC Gamer Margarita"} />
          </Field>
          <Field label="Moneda principal">
            <Select name="defaultCurrency" defaultValue={settings?.defaultCurrency ?? "USD"}>
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </Select>
          </Field>
          <Field label="Minutos minimos entre consultas a CrystoDolar">
            <Input name="rateFetchCooldownMinutes" type="number" min="5" defaultValue={settings?.rateFetchCooldownMinutes ?? 60} />
          </Field>
          <div className="grid content-end gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300"><input name="lowStockEnabled" type="checkbox" defaultChecked={settings?.lowStockEnabled ?? true} className="size-4 accent-cyan-300" /> Alertas de bajo stock</label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input name="autoFetchRatesEnabled" type="checkbox" defaultChecked={settings?.autoFetchRatesEnabled ?? false} className="size-4 accent-cyan-300" /> Permitir actualizacion automatica futura</label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit"><Save size={16} /> Guardar configuracion</Button>
          </div>
        </form>
      </Card>
      <Card>
        <h3 className="font-bold text-white">Respaldos</h3>
        <p className="mt-2 text-sm text-slate-400">Para esta version, exporta e importa productos por CSV desde Importar/Exportar. La estructura queda preparada para respaldo completo futuro.</p>
      </Card>
      <Card>
        <DangerZone />
      </Card>
    </div>
  );
}
