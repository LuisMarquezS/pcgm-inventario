"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { updateFromCrystoDolar } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

export function CrystoUpdateButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateRates() {
    startTransition(async () => {
      try {
        const result = await updateFromCrystoDolar();
        if (result.ok) {
          toast.success(result.message, {
            description: `BCV ${formatNumber(result.rates.bcvRate, 4)} / USDT ${formatNumber(result.rates.parallelRate, 4)}`,
          });
        } else {
          toast.warning(result.message, {
            description: `Actual: BCV ${formatNumber(result.rates.bcvRate, 4)} / USDT ${formatNumber(result.rates.parallelRate, 4)}`,
          });
        }
        router.refresh();
      } catch {
        toast.error("No pudimos actualizar las tasas automaticamente. Puedes ingresarlas manualmente o usar la ultima tasa guardada.");
      }
    });
  }

  return (
    <Button type="button" variant="secondary" onClick={updateRates} disabled={isPending}>
      <RefreshCcw size={16} className={isPending ? "animate-spin" : ""} />
      {isPending ? "Consultando..." : "Actualizar desde CrystoDolar"}
    </Button>
  );
}
