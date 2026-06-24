"use client";

import { useMemo, useState } from "react";
import { Calculator, ImagePlus, Save } from "lucide-react";
import { saveProduct } from "@/app/actions";
import { ProductImagePreview } from "@/components/products/product-image-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { calculatePrices } from "@/lib/pricing";
import { formatBs, formatUSD } from "@/lib/utils";
import type { Category, ExchangeRate, Product } from "@prisma/client";

type ProductFormDefaults = Partial<Pick<Product, "barcode" | "name" | "brand" | "model" | "imageUrl" | "categoryId" | "condition">>;

export function ProductForm({
  product,
  defaults,
  categories,
  latestRate,
}: {
  product?: Product | null;
  defaults?: ProductFormDefaults;
  categories: Category[];
  latestRate: ExchangeRate | null;
}) {
  const [costUSD, setCostUSD] = useState(product?.costUSD ?? 0);
  const [baseSalePriceUSD, setBaseSalePriceUSD] = useState(product?.baseSalePriceUSD ?? 0);
  const [bcvRate, setBcvRate] = useState(product?.lastBCVRate || latestRate?.bcvRate || 1);
  const [parallelRate, setParallelRate] = useState(product?.lastParallelRate || latestRate?.parallelRate || 1);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? defaults?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);

  const prices = useMemo(() => calculatePrices({ costUSD, baseSalePriceUSD, bcvRate, parallelRate }), [costUSD, baseSalePriceUSD, bcvRate, parallelRate]);
  const action = saveProduct.bind(null, product?.id);

  async function uploadImage(file: File | null) {
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.set("file", file);
    const response = await fetch("/api/uploads", { method: "POST", body: data });
    const json = await response.json();
    if (json.url) setImageUrl(json.url);
    setUploading(false);
  }

  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="grid gap-6">
          <Card>
            <h3 className="mb-4 font-bold text-white">1. Informacion basica</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre del producto">
                <Input name="name" defaultValue={product?.name ?? defaults?.name ?? ""} placeholder="Ej. Mouse Logitech G203" required />
              </Field>
              <Field label="SKU interno">
                <Input name="sku" defaultValue={product?.sku ?? ""} placeholder="Opcional" />
              </Field>
              <Field label="Codigo de barra">
                <Input name="barcode" defaultValue={product?.barcode ?? defaults?.barcode ?? ""} placeholder="UPC / EAN opcional" inputMode="numeric" />
              </Field>
              <Field label="Marca">
                <Input name="brand" defaultValue={product?.brand ?? defaults?.brand ?? ""} placeholder="Ej. Logitech" />
              </Field>
              <Field label="Modelo">
                <Input name="model" defaultValue={product?.model ?? defaults?.model ?? ""} placeholder="Ej. G203" />
              </Field>
              <Field label="Condicion">
                <Select name="condition" defaultValue={product?.condition ?? defaults?.condition ?? "NEW"} required>
                  <option value="NEW">Nuevo</option>
                  <option value="REFURBISHED">Refurbished</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 font-bold text-white">2. Categoria y stock</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Categoria">
                <Select name="categoryId" defaultValue={product?.categoryId ?? defaults?.categoryId ?? ""} required>
                  <option value="">Seleccionar</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
              </Field>
              <Field label="Stock tienda">
                <Input name="stockTienda" type="number" min="0" defaultValue={product?.stockTienda ?? product?.stock ?? 0} required />
              </Field>
              <Field label="Stock deposito">
                <Input name="stockDeposito" type="number" min="0" defaultValue={product?.stockDeposito ?? 0} required />
              </Field>
              <Field label="Stock minimo">
                <Input name="minStock" type="number" min="0" defaultValue={product?.minStock ?? 1} required />
              </Field>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 font-bold text-white">3. Costos y precios</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Costo USD" hint="Lo que costo comprar el producto.">
                <Input name="costUSD" type="number" step="0.01" min="0" value={costUSD} onChange={(event) => setCostUSD(Number(event.target.value))} required />
              </Field>
              <Field label="Precio venta base USD" hint="Precio de referencia antes de ajustar por diferencia Binance/BCV.">
                <Input name="baseSalePriceUSD" type="number" step="0.01" min="0" value={baseSalePriceUSD} onChange={(event) => setBaseSalePriceUSD(Number(event.target.value))} required />
              </Field>
              <Field label="Tasa BCV usada">
                <Input name="bcvRate" type="number" step="0.0001" min="0.0001" value={bcvRate} onChange={(event) => setBcvRate(Number(event.target.value))} required />
              </Field>
              <Field label="Tasa Binance/USDT usada">
                <Input name="parallelRate" type="number" step="0.0001" min="0.0001" value={parallelRate} onChange={(event) => setParallelRate(Number(event.target.value))} required />
              </Field>
            </div>
            <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/8 p-4 text-sm text-cyan-100">
              <div className="mb-2 flex items-center gap-2 font-semibold"><Calculator size={16} /> Calculo Venezuela</div>
              Precio ajustado USD = precio base USD x Binance / BCV. Luego el precio en Bs sale con ese USD ajustado x BCV.
            </div>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <h3 className="mb-4 font-bold text-white">4. Foto</h3>
            <div className="relative mb-4 aspect-square overflow-hidden rounded-lg border border-white/10 bg-slate-900">
              <ProductImagePreview
                src={imageUrl}
                alt="Producto"
                fallback={<div className="grid h-full place-items-center text-center text-sm text-slate-500">Placeholder gamer<br />sin foto</div>}
              />
            </div>
            <input type="hidden" name="imageUrl" value={imageUrl} />
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white hover:bg-white/12">
              <ImagePlus size={16} /> {uploading ? "Subiendo..." : "Subir foto"}
              <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadImage(event.target.files?.[0] ?? null)} />
            </label>
            <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => alert("Funcion pendiente de integracion")}>Buscar imagen sugerida</Button>
          </Card>

          <Card>
            <h3 className="mb-4 font-bold text-white">5. Vista previa</h3>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between gap-3"><span className="text-slate-400">Costo</span><strong>{formatUSD(costUSD)}</strong></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Base USD</span><strong>{formatUSD(baseSalePriceUSD)}</strong></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Ajustado USD</span><strong className="text-cyan-200">{formatUSD(prices.adjustedSalePriceUSD)}</strong></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Final Bs</span><strong className="text-lime-200">{formatBs(prices.salePriceBs)}</strong></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Ganancia</span><strong>{formatUSD(prices.profitUSD)}</strong></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Margen</span><strong>{prices.profitMarginPercent}%</strong></div>
            </div>
            <input type="hidden" name="isActive" value="true" />
            <Button className="mt-5 w-full" type="submit"><Save size={16} /> Guardar producto</Button>
          </Card>
        </div>
      </div>
    </form>
  );
}
