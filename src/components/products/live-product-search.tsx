"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/field";

export function LiveProductSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      const nextValue = value.trim();

      if (current === nextValue) return;

      const params = new URLSearchParams(searchParams.toString());
      if (nextValue) {
        params.set("q", nextValue);
      } else {
        params.delete("q");
      }

      startTransition(() => {
        const queryString = params.toString();
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, searchParams, value]);

  return (
    <div className="relative">
      <Input
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar por nombre, marca, modelo, SKU..."
        autoComplete="off"
        className="pr-24"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-cyan-200">
        {isPending ? "Buscando..." : "En vivo"}
      </span>
    </div>
  );
}
