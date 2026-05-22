"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ReceiptText, ShoppingCart, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { finishSale } from "@/app/actions";
import { ConditionBadge } from "@/components/products/condition-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatBs, formatUSD } from "@/lib/utils";

type ProductForSale = {
  id: string;
  sku: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  condition: string;
  stock: number;
  adjustedSalePriceUSD: number;
  salePriceBs: number;
  isActive: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
};

type CartLine = {
  product: ProductForSale;
  quantity: number;
};

export function SalesRegister({ products, categories }: { products: ProductForSale[]; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; number: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !q || [product.name, product.sku, product.brand, product.model].some((value) => value?.toLowerCase().includes(q));
      const matchesCategory = !categoryId || product.categoryId === categoryId;
      return matchesQuery && matchesCategory && product.isActive;
    }).slice(0, 36);
  }, [categoryId, products, query]);

  const totals = useMemo(() => {
    return cart.reduce((acc, line) => {
      acc.items += 1;
      acc.quantity += line.quantity;
      acc.usd += line.product.adjustedSalePriceUSD * line.quantity;
      acc.bs += line.product.salePriceBs * line.quantity;
      return acc;
    }, { items: 0, quantity: 0, usd: 0, bs: 0 });
  }, [cart]);

  function addProduct(product: ProductForSale, quantity: number) {
    if (product.stock <= 0) {
      toast.error("Ese producto esta agotado");
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      const currentQuantity = existing?.quantity ?? 0;
      const nextQuantity = Math.min(product.stock, currentQuantity + quantity);
      if (nextQuantity <= currentQuantity) toast.error("No hay stock suficiente para agregar mas");
      if (existing) {
        return current.map((line) => line.product.id === product.id ? { ...line, quantity: nextQuantity } : line);
      }
      return [...current, { product, quantity: Math.min(product.stock, quantity) }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) => current.flatMap((line) => {
      if (line.product.id !== productId) return [line];
      const next = line.quantity + delta;
      if (next <= 0) return [];
      if (next > line.product.stock) {
        toast.error("No puedes vender mas que el stock disponible");
        return [line];
      }
      return [{ ...line, quantity: next }];
    }));
  }

  function submitSale(formData: FormData) {
    if (cart.length === 0) {
      toast.error("El carrito esta vacio");
      return;
    }
    startTransition(async () => {
      try {
        const result = await finishSale({
          customerName: String(formData.get("customerName") ?? ""),
          customerPhone: String(formData.get("customerPhone") ?? ""),
          customerDocument: String(formData.get("customerDocument") ?? ""),
          customerAddress: String(formData.get("customerAddress") ?? ""),
          notes: String(formData.get("notes") ?? ""),
          items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        });
        if (result.ok) {
          toast.success("Venta registrada y stock descontado");
          setCart([]);
          setConfirming(false);
          setLastSale({ id: result.saleId, number: result.saleNumber });
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo finalizar la venta");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">Ventas</h2>
          <p className="mt-1 text-slate-400">Busca, agrega al carrito, confirma y descuenta stock.</p>
        </div>
        <Link href="/sales/history" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white hover:bg-white/10">
          <ReceiptText size={16} /> Historial
        </Link>
      </div>

      {lastSale ? (
        <Card className="border-lime-300/30 bg-lime-300/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Venta {lastSale.number} registrada.</span>
            <Link href={`/sales/${lastSale.id}`} className="font-semibold text-lime-100 underline">Ver nota de entrega</Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, SKU, marca o modelo..." />
            <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Todas las categorias</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {visibleProducts.map((product) => (
              <ProductSaleCard key={product.id} product={product} onAdd={addProduct} />
            ))}
          </div>
        </Card>

        <Card className="sticky top-24 self-start">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-bold text-white"><ShoppingCart size={18} /> Carrito actual</h3>
            <Badge tone="cyan">{totals.items} items</Badge>
          </div>

          <div className="grid gap-3">
            {cart.length === 0 ? <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">Agrega productos para iniciar la venta.</p> : null}
            {cart.map((line) => (
              <div key={line.product.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{line.product.name}</p>
                    <p className="text-xs text-slate-400">{formatUSD(line.product.adjustedSalePriceUSD)} / {formatBs(line.product.salePriceBs)}</p>
                  </div>
                  <button onClick={() => setCart((current) => current.filter((item) => item.product.id !== line.product.id))} className="text-rose-200 hover:text-rose-100" aria-label="Quitar"><X size={17} /></button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" className="size-9 p-0" onClick={() => updateQuantity(line.product.id, -1)}><Minus size={14} /></Button>
                    <strong>{line.quantity}</strong>
                    <Button type="button" variant="secondary" className="size-9 p-0" onClick={() => updateQuantity(line.product.id, 1)}><Plus size={14} /></Button>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold text-white">{formatUSD(line.product.adjustedSalePriceUSD * line.quantity)}</p>
                    <p className="text-lime-200">{formatBs(line.product.salePriceBs * line.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-2 rounded-lg bg-white/5 p-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Productos</span><strong>{totals.quantity}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">Total USD</span><strong>{formatUSD(totals.usd)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">Total Bs</span><strong className="text-lime-200">{formatBs(totals.bs)}</strong></div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" disabled={cart.length === 0} onClick={() => setCart([])}><Trash2 size={16} /> Vaciar</Button>
            <Button type="button" disabled={cart.length === 0} onClick={() => setConfirming(true)}>Finalizar venta</Button>
          </div>
        </Card>
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-50 grid items-end bg-black/70 p-0 backdrop-blur-sm md:place-items-center md:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl md:max-w-2xl md:rounded-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">Finalizar venta</h3>
                <p className="text-sm text-slate-400">Se descontara stock al confirmar.</p>
              </div>
              <button onClick={() => setConfirming(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Cerrar"><X size={18} /></button>
            </div>
            <form action={submitSale} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Cliente">
                  <Input name="customerName" placeholder="Opcional" />
                </Field>
                <Field label="Telefono">
                  <Input name="customerPhone" placeholder="Opcional" />
                </Field>
                <Field label="Cedula/RIF">
                  <Input name="customerDocument" placeholder="Opcional" />
                </Field>
                <Field label="Direccion">
                  <Input name="customerAddress" placeholder="Opcional" />
                </Field>
              </div>
              <Field label="Notas">
                <Textarea name="notes" placeholder="Opcional" />
              </Field>
              <div className="rounded-lg bg-white/5 p-4 text-sm">
                <p className="mb-2 font-semibold text-white">Resumen</p>
                <div className="flex justify-between"><span>Total USD</span><strong>{formatUSD(totals.usd)}</strong></div>
                <div className="flex justify-between"><span>Total Bs</span><strong className="text-lime-200">{formatBs(totals.bs)}</strong></div>
                <div className="flex justify-between"><span>Unidades</span><strong>{totals.quantity}</strong></div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>Confirmar y descontar stock</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProductSaleCard({ product, onAdd }: { product: ProductForSale; onAdd: (product: ProductForSale, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  const soldOut = product.stock <= 0;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{product.name}</p>
          <p className="text-xs text-slate-400">{product.sku ?? "Sin SKU"} - {product.brand ?? ""} {product.model ?? ""}</p>
        </div>
        <ConditionBadge condition={product.condition} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={soldOut ? "red" : "green"}>{soldOut ? "Agotado" : `Stock ${product.stock}`}</Badge>
        <Badge tone="cyan">{product.category?.name ?? "Sin categoria"}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <span className="text-slate-400">USD</span><strong className="text-right">{formatUSD(product.adjustedSalePriceUSD)}</strong>
        <span className="text-slate-400">Bs</span><strong className="text-right text-lime-200">{formatBs(product.salePriceBs)}</strong>
      </div>
      <div className="mt-4 flex gap-2">
        <Input type="number" min="1" max={product.stock} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} disabled={soldOut} className="w-24" aria-label="Cantidad" />
        <Button type="button" disabled={soldOut} onClick={() => onAdd(product, Math.max(1, quantity))} className="flex-1">Agregar</Button>
      </div>
    </div>
  );
}
