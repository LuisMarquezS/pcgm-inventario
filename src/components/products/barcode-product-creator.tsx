"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Barcode, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import type { Category, ExchangeRate } from "@prisma/client";

type LookupProduct = {
  barcode: string;
  name: string;
  brand: string;
  model: string;
  imageUrl: string;
  categoryName: string;
};

type ExistingProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
};

type LookupState =
  | { status: "idle"; product?: never; existing?: never; message?: never }
  | { status: "found"; product: LookupProduct; existing?: never; message?: string; source?: string }
  | { status: "existing"; existing: ExistingProduct; product?: never; message: string }
  | { status: "empty"; message: string; product?: never; existing?: never };

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

export function BarcodeProductCreator({
  categories,
  latestRate,
}: {
  categories: Category[];
  latestRate: ExchangeRate | null;
}) {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });

  const defaults = useMemo(() => {
    if (lookup.status !== "found") return undefined;
    const suggestedCategory = normalizeName(lookup.product.categoryName);
    const category = categories.find((item) => normalizeName(item.name) === suggestedCategory)
      ?? categories.find((item) => normalizeName(item.name) === "OTROS");

    return {
      barcode: lookup.product.barcode,
      name: lookup.product.name,
      brand: lookup.product.brand,
      model: lookup.product.model,
      imageUrl: lookup.product.imageUrl,
      categoryId: category?.id,
      condition: "NEW",
    };
  }, [categories, lookup]);

  async function handleLookup() {
    const clean = barcode.replace(/\D/g, "");
    if (!clean) {
      toast.error("Escribe o escanea un codigo de barra.");
      return;
    }

    setBarcode(clean);
    setLoading(true);
    setLookup({ status: "idle" });

    try {
      const response = await fetch(`/api/products/barcode-lookup?barcode=${encodeURIComponent(clean)}`);
      const json = await response.json();

      if (json.existing) {
        setLookup({ status: "existing", existing: json.existing, message: json.message });
        toast.info(json.message);
        return;
      }

      if (json.product) {
        setLookup({ status: "found", product: json.product, source: json.source });
        toast.success(`Datos encontrados${json.source ? ` en ${json.source}` : ""}. Revisa y completa el producto.`);
        return;
      }

      const message = json.message || "No encontramos datos para ese codigo.";
      setLookup({ status: "empty", message });
      toast.warning(message);
    } catch {
      const message = "No pudimos consultar UPCitemdb. Puedes crear el producto manualmente.";
      setLookup({ status: "empty", message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <Field
            label="Codigo de barra"
            hint="Puedes escribirlo o escanearlo con una pistola USB. La consulta externa es opcional."
          >
            <Input
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleLookup();
                }
              }}
              placeholder="Ej. 097855075758"
              inputMode="numeric"
              autoFocus
            />
          </Field>
          <Button type="button" onClick={handleLookup} disabled={loading}>
            {loading ? <Barcode size={16} /> : <Search size={16} />}
            {loading ? "Buscando..." : "Buscar en UPCitemdb"}
          </Button>
        </div>
      </Card>

      {lookup.status === "existing" ? (
        <Card className="border-lime-300/30 bg-lime-300/8">
          <p className="text-sm font-semibold text-lime-100">{lookup.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span>{lookup.existing.name}</span>
            {lookup.existing.sku ? <span>SKU {lookup.existing.sku}</span> : null}
            <Link
              href={`/products/${lookup.existing.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-lime-300/20 px-3 py-2 font-semibold text-lime-100 hover:bg-lime-300/10"
            >
              Abrir producto <ExternalLink size={14} />
            </Link>
          </div>
        </Card>
      ) : null}

      {lookup.status === "found" ? (
        <Card className="border-cyan-300/25 bg-cyan-300/8">
          <p className="text-sm font-semibold text-cyan-100">
            Datos encontrados{lookup.source ? ` en ${lookup.source}` : ""}. Revisa el nombre, categoria y stock antes de guardar.
          </p>
        </Card>
      ) : null}

      {lookup.status === "empty" ? (
        <Card className="border-yellow-300/30 bg-yellow-300/8">
          <p className="text-sm font-semibold text-yellow-100">{lookup.message}</p>
          <p className="mt-1 text-sm text-slate-300">Igual puedes llenar el formulario manualmente guardando este codigo.</p>
        </Card>
      ) : null}

      <ProductForm
        key={defaults ? `${defaults.barcode}-${defaults.name}` : barcode}
        categories={categories}
        latestRate={latestRate}
        defaults={defaults ?? { barcode, condition: "NEW" }}
      />
    </div>
  );
}
