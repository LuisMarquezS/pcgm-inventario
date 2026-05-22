"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ReceiptText, ShoppingCart, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { finishSale } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatBs, formatUSD } from "@/lib/utils";

export type CartProduct = {
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
};

type CartLine = {
  product: CartProduct;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  totals: { items: number; quantity: number; usd: number; bs: number };
  addProduct: (product: CartProduct, quantity?: number) => void;
  openCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "pcgm-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; number: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setLines(JSON.parse(raw));
      } catch {
        localStorage.removeItem(storageKey);
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(lines));
  }, [hydrated, lines]);

  const totals = useMemo(() => lines.reduce((acc, line) => {
    acc.items += 1;
    acc.quantity += line.quantity;
    acc.usd += line.product.adjustedSalePriceUSD * line.quantity;
    acc.bs += line.product.salePriceBs * line.quantity;
    return acc;
  }, { items: 0, quantity: 0, usd: 0, bs: 0 }), [lines]);

  function addProduct(product: CartProduct, quantity = 1) {
    if (!product.isActive) {
      toast.error("Ese producto esta inactivo");
      return;
    }
    if (product.stock <= 0) {
      toast.error("Ese producto esta agotado");
      return;
    }
    setLines((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      const currentQuantity = existing?.quantity ?? 0;
      const nextQuantity = Math.min(product.stock, currentQuantity + quantity);
      if (nextQuantity <= currentQuantity) {
        toast.error("No hay stock suficiente para agregar mas");
        return current;
      }
      toast.success("Producto agregado al carrito");
      if (existing) {
        return current.map((line) => line.product.id === product.id ? { ...line, product, quantity: nextQuantity } : line);
      }
      return [...current, { product, quantity: Math.min(product.stock, quantity) }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setLines((current) => current.flatMap((line) => {
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
    if (lines.length === 0) {
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
          items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        });
        if (result.ok) {
          setLines([]);
          setConfirming(false);
          setLastSale({ id: result.saleId, number: result.saleNumber });
          toast.success("Venta registrada y stock descontado");
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo finalizar la venta");
      }
    });
  }

  const value = useMemo(() => ({
    lines,
    totals,
    addProduct,
    openCart: () => setOpen(true),
  }), [lines, totals]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <h3 className="flex items-center gap-2 font-black text-white"><ShoppingCart size={18} /> Carrito</h3>
                <p className="text-sm text-slate-400">{totals.quantity} productos - {formatUSD(totals.usd)}</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Cerrar carrito"><X size={18} /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="grid gap-3">
                {lines.length === 0 ? <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">Agrega productos desde Inventario.</p> : null}
                {lines.map((line) => (
                  <div key={line.product.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{line.product.name}</p>
                        <p className="text-xs text-slate-400">{formatUSD(line.product.adjustedSalePriceUSD)} / {formatBs(line.product.salePriceBs)}</p>
                      </div>
                      <button onClick={() => setLines((current) => current.filter((item) => item.product.id !== line.product.id))} className="text-rose-200 hover:text-rose-100" aria-label="Quitar producto"><X size={17} /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="secondary" className="size-8 p-0" onClick={() => updateQuantity(line.product.id, -1)} aria-label="Reducir cantidad"><Minus size={14} /></Button>
                        <strong>{line.quantity}</strong>
                        <Button type="button" variant="secondary" className="size-8 p-0" onClick={() => updateQuantity(line.product.id, 1)} aria-label="Aumentar cantidad"><Plus size={14} /></Button>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-bold text-white">{formatUSD(line.product.adjustedSalePriceUSD * line.quantity)}</p>
                        <p className="text-lime-200">{formatBs(line.product.salePriceBs * line.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 p-4">
              {lastSale ? (
                <div className="mb-3 rounded-lg border border-lime-300/30 bg-lime-300/10 p-3 text-sm">
                  <p>Venta {lastSale.number} registrada.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={`/sales/${lastSale.id}`} onClick={() => setOpen(false)} className="font-semibold text-lime-100 underline">Ver nota de entrega</Link>
                    <Link href="/sales" onClick={() => setOpen(false)} className="font-semibold text-lime-100 underline">Ir a ventas</Link>
                  </div>
                </div>
              ) : null}
              <div className="mb-4 grid gap-2 rounded-lg bg-white/5 p-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Total USD</span><strong>{formatUSD(totals.usd)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Total Bs</span><strong className="text-lime-200">{formatBs(totals.bs)}</strong></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" disabled={lines.length === 0} onClick={() => setLines([])}><Trash2 size={16} /> Vaciar</Button>
                <Button type="button" disabled={lines.length === 0} onClick={() => setConfirming(true)}>Finalizar</Button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {confirming ? (
        <div className="fixed inset-0 z-[60] grid items-end bg-black/70 p-0 backdrop-blur-sm md:place-items-center md:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl md:max-w-2xl md:rounded-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">Finalizar venta</h3>
                <p className="text-sm text-slate-400">Se descontara stock al confirmar.</p>
              </div>
              <button onClick={() => setConfirming(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Cerrar confirmacion"><X size={18} /></button>
            </div>
            <form action={submitSale} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Cliente"><Input name="customerName" placeholder="Opcional" /></Field>
                <Field label="Telefono"><Input name="customerPhone" placeholder="Opcional" /></Field>
                <Field label="Cedula/RIF"><Input name="customerDocument" placeholder="Opcional" /></Field>
                <Field label="Direccion"><Input name="customerAddress" placeholder="Opcional" /></Field>
              </div>
              <Field label="Notas"><Textarea name="notes" placeholder="Opcional" /></Field>
              <div className="rounded-lg bg-white/5 p-4 text-sm">
                <p className="mb-2 font-semibold text-white">Resumen</p>
                <div className="flex justify-between"><span>Total USD</span><strong>{formatUSD(totals.usd)}</strong></div>
                <div className="flex justify-between"><span>Total Bs</span><strong className="text-lime-200">{formatBs(totals.bs)}</strong></div>
                <div className="flex justify-between"><span>Unidades</span><strong>{totals.quantity}</strong></div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}><ReceiptText size={16} /> Confirmar venta</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
