"use client";

import { useMemo, useState, useTransition } from "react";
import { Layers3, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createCategory, deleteOrDeactivateCategory, updateCategory } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count: { products: number };
};

export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todas");
  const [selected, setSelected] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return categories.filter((category) => {
      const matchesQuery = category.name.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "todas" ||
        (filter === "activas" && category.isActive) ||
        (filter === "inactivas" && !category.isActive);
      return matchesQuery && matchesFilter;
    });
  }, [categories, filter, query]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">Categorias</h2>
          <p className="mt-1 text-slate-400">Organiza tipos de mercancia sin una lista eterna de formularios.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> Nueva categoria</Button>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar categoria..." />
          <Select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="todas">Todas</option>
            <option value="activas">Activas</option>
            <option value="inactivas">Inactivas</option>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-3">
          {filtered.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelected(category)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/14"
            >
              <Layers3 size={15} />
              {category.name}
              <span className="rounded-full bg-slate-950/80 px-2 py-0.5 text-xs text-slate-300">{category._count.products}</span>
              {!category.isActive ? <Badge tone="muted">Inactiva</Badge> : null}
            </button>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-slate-400">No hay categorias con ese filtro.</p> : null}
        </div>
      </Card>

      {selected ? <CategoryModal category={selected} onClose={() => setSelected(null)} /> : null}
      {creating ? <CategoryModal onClose={() => setCreating(false)} /> : null}
    </div>
  );
}

function CategoryModal({ category, onClose }: { category?: CategoryRow; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const productCount = category?._count.products ?? 0;

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        if (category) {
          const result = await updateCategory(category.id, formData);
          if (result?.ok) toast.success("Categoria actualizada");
        } else {
          formData.set("isActive", "on");
          const result = await createCategory(formData);
          if (result?.ok) toast.success("Categoria creada");
        }
        onClose();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo guardar la categoria");
      }
    });
  }

  function remove() {
    if (!category) return;
    startTransition(async () => {
      if (!confirm("Eliminar esta categoria?")) return;
      const result = await deleteOrDeactivateCategory(category.id);
      if (result?.ok) {
        toast.success("Categoria eliminada");
        onClose();
      } else {
        toast.error(result?.message ?? "No se puede eliminar esta categoria");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/70 p-0 backdrop-blur-sm md:place-items-center md:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl md:max-w-xl md:rounded-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-white">{category ? category.name : "Nueva categoria"}</h3>
            <p className="text-sm text-slate-400">{productCount} productos asociados</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Cerrar"><X size={18} /></button>
        </div>

        <form action={submit} className="grid gap-4">
          <Field label="Nombre">
            <Input name="name" defaultValue={category?.name ?? ""} required />
          </Field>
          <Field label="Descripcion">
            <Input name="description" defaultValue={category?.description ?? ""} placeholder="Opcional" />
          </Field>
          {category ? (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input name="isActive" type="checkbox" defaultChecked={category.isActive} className="size-4 accent-cyan-300" />
              Categoria activa
            </label>
          ) : null}

          {productCount > 0 ? (
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
              Esta categoria tiene productos asociados. Puedes desactivarla, pero no eliminarla.
            </div>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <div>
              {category && productCount === 0 ? (
                <Button type="button" variant="danger" onClick={remove} disabled={isPending}><Trash2 size={16} /> Eliminar</Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isPending}><Save size={16} /> Guardar</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
