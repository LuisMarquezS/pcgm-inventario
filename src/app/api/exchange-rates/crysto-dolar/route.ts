import { NextResponse } from "next/server";
import { fetchCrystoDolarRates } from "@/lib/exchange-rate-providers/crystoDolar";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    const rates = await fetchCrystoDolarRates(settings?.rateFetchCooldownMinutes ?? 60);
    return NextResponse.json({
      ok: rates.source === "CrystoDolar",
      fallback: rates.source !== "CrystoDolar",
      message: rates.source === "CrystoDolar"
        ? "Tasas obtenidas desde CrystoDolar."
        : "No pudimos obtener tasas nuevas desde CrystoDolar. Se mantiene la ultima tasa guardada.",
      rates,
    });
  } catch (error) {
    console.error("[api/exchange-rates/crysto-dolar]", error);
    return NextResponse.json({
      ok: false,
      message: "No pudimos actualizar las tasas automaticamente. Puedes ingresarlas manualmente o usar la ultima tasa guardada.",
    }, { status: 503 });
  }
}
