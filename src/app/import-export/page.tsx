import Link from "next/link";
import { Download, FileDown, FileUp } from "lucide-react";
import { importProductsFromCsv } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ImportExportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black text-white">Importar / Exportar</h2>
        <p className="mt-1 text-slate-400">Trae productos desde CSV y saca respaldo para Excel cuando lo necesites.</p>
      </div>

      {params.imported ? (
        <Card className="border-lime-300/30 bg-lime-300/10">
          Importacion lista: {params.imported} productos importados, {params.errors ?? 0} filas con errores, {params.categories ?? 0} categorias creadas.
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-bold text-white"><FileUp size={18} /> Importar CSV</h3>
          <form action={importProductsFromCsv} className="grid gap-4">
            <Field label="Archivo CSV" hint="Columnas: nombre, marca, modelo, sku, barcode, categoria, condicion, estado, stockTienda, stockDeposito, stockAlmacenExterno, stockMinimo, costoUSD, precioVentaBaseUSD.">
              <Input name="file" type="file" accept=".csv,text/csv" required />
            </Field>
            <Button type="submit">Importar productos</Button>
          </form>
          <Link href="/templates/inventario-ejemplo.csv" className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
            <Download size={16} /> Descargar plantilla de ejemplo
          </Link>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-bold text-white"><FileDown size={18} /> Exportar inventario</h3>
          <p className="mb-4 text-sm text-slate-400">Incluye ID, SKU, codigo de barra, categoria, stock total, stock tienda, stock deposito, stock almacen externo, costos, precios calculados, tasas usadas, margen y fechas.</p>
          <a href="/api/export/products" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
            <Download size={16} /> Exportar CSV
          </a>
        </Card>
      </div>
    </div>
  );
}
