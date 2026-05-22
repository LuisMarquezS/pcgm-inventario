"use client";

import { ShoppingCart } from "lucide-react";
import { useCart, type CartProduct } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

export function AddToCartButton({ product, className }: { product: CartProduct; className?: string }) {
  const { addProduct } = useCart();
  const disabled = !product.isActive || product.stock <= 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addProduct(product, 1)}
      className={cn("inline-grid size-8 place-items-center rounded-lg border border-lime-300/20 bg-lime-300/10 text-lime-100 transition hover:border-lime-200/50 hover:bg-lime-300/16 focus:outline-none focus:ring-2 focus:ring-lime-300 disabled:cursor-not-allowed disabled:opacity-40", className)}
      aria-label="Agregar al carrito"
      title="Agregar al carrito"
    >
      <ShoppingCart size={15} />
    </button>
  );
}
