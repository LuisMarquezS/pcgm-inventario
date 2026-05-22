import { prisma } from "@/lib/prisma";
import type { ProviderRateResult } from "./index";

const BCV_ENDPOINT = "https://crystodolarvzla.site/BCV?days=30&pair=USD-VES";
const BINANCE_ENDPOINT = "https://crystodolarvzla.site/BINANCE_P2P?days=30&pair=USDT-VES";
const HOME_PAGE = "https://crystodolarvzla.site/";

let memoryCache: { data?: ProviderRateResult; blockedUntil?: number } = {};

function latestNumericRate(payload: unknown): number | null {
  if (typeof payload === "number") return payload;
  if (!payload || typeof payload !== "object") return null;
  const values = Array.isArray(payload) ? payload : Object.values(payload);

  for (const item of values.reverse()) {
    if (typeof item === "number") return item;
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const candidates = ["price", "rate", "value", "promedio", "sell", "close"];
      for (const key of candidates) {
        const value = record[key];
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          const parsed = Number(value.replace(",", "."));
          if (Number.isFinite(parsed)) return parsed;
        }
      }
    }
  }

  return null;
}

export function parseCrystoDolarRates(bcvPayload: unknown, binancePayload: unknown): ProviderRateResult {
  const bcvRate = latestNumericRate(bcvPayload);
  const parallelRate = latestNumericRate(binancePayload);

  if (!bcvRate || !parallelRate) {
    throw new Error("CrystoDolar response did not include usable rates.");
  }

  return {
    bcvRate,
    parallelRate,
    source: "CrystoDolar",
    updatedAt: new Date().toISOString(),
    notes: "Tasas obtenidas desde CrystoDolar Venezuela.",
  };
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&amp;/g, "&");
}

function extractSerializedRate(html: string, exchangeCode: string, pair: string, priceKey: "buy_price" | "sell_price") {
  const decoded = decodeHtmlEntities(html);
  const exchangeIndex = decoded.indexOf(`"exchange_code":[0,"${exchangeCode}"]`);
  if (exchangeIndex < 0) return null;
  const pairIndex = decoded.indexOf(`"currency_pair":[0,"${pair}"]`, exchangeIndex);
  if (pairIndex < 0) return null;
  const nextRecordIndex = decoded.indexOf(`"exchange_code":[0,`, exchangeIndex + 1);
  const endIndex = nextRecordIndex > pairIndex ? nextRecordIndex : decoded.length;
  const record = decoded.slice(exchangeIndex, endIndex);
  const match = record.match(new RegExp(`"${priceKey}":\\[0,([0-9.]+)\\]`));
  return match ? Number(match[1]) : null;
}

function extractSerializedDate(html: string) {
  const decoded = decodeHtmlEntities(html);
  return decoded.match(/"last_updated":\[0,"([^"]+)"\]/)?.[1] ?? new Date().toISOString();
}

async function fetchRatesFromHomePage(): Promise<ProviderRateResult> {
  console.info("[CrystoDolar] Fetching rates from public home page snapshot.");
  const response = await fetch(HOME_PAGE, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`CrystoDolar home page failed: ${response.status}`);
  }

  const html = await response.text();
  const bcvRate = extractSerializedRate(html, "BCV", "USD/VES", "sell_price");
  const parallelRate =
    extractSerializedRate(html, "BINANCE_P2P", "USDT/VES", "buy_price") ??
    extractSerializedRate(html, "BINANCE_P2P", "USDT/VES", "sell_price");

  if (!bcvRate || !parallelRate) {
    throw new Error("CrystoDolar home page did not include usable serialized rates.");
  }

  return {
    bcvRate,
    parallelRate,
    source: "CrystoDolar",
    updatedAt: extractSerializedDate(html),
    notes: "Tasas obtenidas desde la pagina publica de CrystoDolar.",
  };
}

export async function getCachedRates() {
  if (memoryCache.data) return memoryCache.data;
  return fallbackToLastSavedRates();
}

export async function fallbackToLastSavedRates(): Promise<ProviderRateResult | null> {
  const last = await prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } });
  if (!last) return null;
  return {
    bcvRate: last.bcvRate,
    parallelRate: last.parallelRate,
    source: last.source === "CrystoDolar" ? "CrystoDolar" : "Manual",
    updatedAt: last.createdAt.toISOString(),
    notes: "Usando la ultima tasa guardada.",
  };
}

export async function saveRatesToDatabase(rates: ProviderRateResult) {
  return prisma.exchangeRate.create({
    data: {
      bcvRate: rates.bcvRate,
      parallelRate: rates.parallelRate,
      source: rates.source,
      notes: rates.notes,
    },
  });
}

export async function fetchCrystoDolarRates(cooldownMinutes = 60): Promise<ProviderRateResult> {
  const now = Date.now();
  if (memoryCache.blockedUntil && now < memoryCache.blockedUntil) {
    console.warn("[CrystoDolar] Cooldown active after previous rate-limit/error.");
    const cached = await getCachedRates();
    if (cached) return cached;
    throw new Error("CrystoDolar cooldown active and no cached rates exist.");
  }

  try {
    console.info("[CrystoDolar] Fetching exchange rates.");
    const [bcvResponse, binanceResponse] = await Promise.all([
      fetch(BCV_ENDPOINT, { cache: "no-store" }),
      fetch(BINANCE_ENDPOINT, { cache: "no-store" }),
    ]);

    if (bcvResponse.status === 429 || binanceResponse.status === 429) {
      memoryCache.blockedUntil = now + cooldownMinutes * 60 * 1000;
      throw new Error("CrystoDolar rate limit: 429 Too Many Requests.");
    }

    if (!bcvResponse.ok || !binanceResponse.ok) {
      console.warn(`[CrystoDolar] Historical endpoints failed: BCV ${bcvResponse.status}, Binance ${binanceResponse.status}. Trying home page snapshot.`);
      const rates = await fetchRatesFromHomePage();
      memoryCache = { data: rates };
      return rates;
    }

    const rates = parseCrystoDolarRates(await bcvResponse.json(), await binanceResponse.json());
    memoryCache = { data: rates };
    return rates;
  } catch (error) {
    console.error("[CrystoDolar] Automatic update failed.", error);
    const fallback = await fallbackToLastSavedRates();
    if (fallback) return fallback;
    throw error;
  }
}
