"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatUSD } from "@/lib/utils";

export function CartHeaderButton() {
  const { totals, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/16 focus:outline-none focus:ring-2 focus:ring-cyan-300"
      aria-label={`Abrir carrito con ${totals.quantity} productos`}
      title="Carrito"
    >
      <span className="relative inline-flex">
        <ShoppingCart size={18} />
        {totals.quantity > 0 ? <span className="absolute -right-2 -top-2 rounded-full bg-fuchsia-500 px-1.5 text-[10px] leading-4 text-white">{totals.quantity}</span> : null}
      </span>
      <span className="hidden sm:inline">Carrito</span>
      {totals.quantity > 0 ? <span className="hidden md:inline text-slate-300">{formatUSD(totals.usd)}</span> : null}
    </button>
  );
}
