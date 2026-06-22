"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { wipeDatabase } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function DangerZone() {
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canSubmit = accepted && confirmation === "BORRAR TODO" && !isPending;

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await wipeDatabase(formData);
      if (result.ok) {
        localStorage.removeItem("pcgm-cart");
        toast.success(result.message, {
          description: "Se creo un respaldo antes de borrar.",
        });
        setConfirmation("");
        setAccepted(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-rose-300/25 bg-rose-300/10 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-rose-200" size={20} />
          <div>
            <h3 className="font-bold text-white">Borrar toda la base de datos</h3>
            <p className="mt-2 text-sm text-slate-300">
              Esta accion elimina productos, categorias, tasas, ventas, notas de entrega y configuracion local.
              Antes de borrar se crea un respaldo automatico en la carpeta <strong>prisma/backups</strong>.
            </p>
          </div>
        </div>
      </div>

      <form action={submit} className="grid gap-4">
        <label className="flex items-start gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 size-4 accent-rose-400"
          />
          Entiendo que esto vaciara el inventario y el historial de ventas de esta computadora.
        </label>

        <Field label='Escribe "BORRAR TODO" para confirmar'>
          <Input
            name="confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="BORRAR TODO"
            autoComplete="off"
          />
        </Field>

        <div>
          <Button type="submit" variant="danger" disabled={!canSubmit}>
            <Trash2 size={16} />
            {isPending ? "Borrando..." : "Borrar toda la base de datos"}
          </Button>
        </div>
      </form>
    </div>
  );
}
