import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type UpcItemDbItem = {
  ean?: string;
  upc?: string;
  title?: string;
  brand?: string;
  model?: string;
  category?: string;
  images?: string[];
};

type UpcItemDbResponse = {
  code?: string;
  total?: number;
  items?: UpcItemDbItem[];
};

type BarcodeLookupProduct = {
  barcode_number?: string;
  title?: string;
  brand?: string;
  manufacturer?: string;
  model?: string;
  mpn?: string;
  category?: string;
  images?: string[];
};

type BarcodeLookupResponse = {
  products?: BarcodeLookupProduct[];
};

function cleanBarcode(value: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

function guessCategory(category?: string, title?: string) {
  const text = `${category ?? ""} ${title ?? ""}`.toLowerCase();
  if (text.includes("keyboard") || text.includes("teclado")) return "TECLADO";
  if (text.includes("mouse")) return "MOUSE";
  if (text.includes("headset") || text.includes("headphone") || text.includes("audif")) return "AUDIFONOS";
  if (text.includes("ssd")) return "SSD";
  if (text.includes("hard drive") || text.includes("hdd")) return "HDD";
  if (text.includes("memory") || text.includes("ram")) return "RAM";
  if (text.includes("monitor")) return "MONITOR";
  if (text.includes("controller") || text.includes("control")) return "CONTROL";
  if (text.includes("console") || text.includes("playstation") || text.includes("xbox") || text.includes("nintendo")) return "CONSOLA";
  return "OTROS";
}

function mapBarcodeLookupProduct(item: BarcodeLookupProduct, barcode: string) {
  return {
    barcode: item.barcode_number || barcode,
    name: item.title || "",
    brand: item.brand || item.manufacturer || "",
    model: item.model || item.mpn || "",
    imageUrl: item.images?.[0] || "",
    categoryName: guessCategory(item.category, item.title),
  };
}

async function fetchBarcodeLookupProduct(barcode: string) {
  const apiKey = process.env.BARCODE_LOOKUP_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    barcode,
    key: apiKey,
  });

  const response = await fetch(`https://api.barcodelookup.com/v3/products?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PCGM-Inventario/1.0",
    },
    cache: "no-store",
  });

  if (response.status === 403) {
    return {
      ok: false as const,
      status: 403,
      message: "Barcode Lookup rechazo la API key. Revisa BARCODE_LOOKUP_API_KEY en .env.",
    };
  }

  if (response.status === 429) {
    return {
      ok: false as const,
      status: 429,
      message: "Barcode Lookup limito las consultas por ahora. Puedes crear el producto manualmente o intentar luego.",
    };
  }

  if (response.status === 404) return null;

  if (!response.ok) {
    return {
      ok: false as const,
      status: 502,
      message: "No pudimos consultar Barcode Lookup en este momento.",
    };
  }

  const payload = await response.json() as BarcodeLookupResponse;
  const item = payload.products?.[0];
  if (!item) return null;

  return {
    ok: true as const,
    product: mapBarcodeLookupProduct(item, barcode),
  };
}

async function fetchUpcItemDbProduct(barcode: string) {
  const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PCGM-Inventario/1.0",
    },
    cache: "no-store",
  });

  if (response.status === 429) {
    return {
      ok: false as const,
      status: 429,
      message: "UPCitemdb limito las consultas por ahora. Puedes crear el producto manualmente con este codigo.",
    };
  }

  if (!response.ok) {
    return {
      ok: false as const,
      status: 502,
      message: "No pudimos consultar UPCitemdb en este momento. Puedes crear el producto manualmente.",
    };
  }

  const payload = await response.json() as UpcItemDbResponse;
  const item = payload.items?.[0];
  if (!item) return null;

  return {
    ok: true as const,
    product: {
      barcode: item.ean || item.upc || barcode,
      name: item.title || "",
      brand: item.brand || "",
      model: item.model || "",
      imageUrl: item.images?.[0] || "",
      categoryName: guessCategory(item.category, item.title),
    },
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const barcode = cleanBarcode(url.searchParams.get("barcode"));

  if (barcode.length < 6) {
    return NextResponse.json({ ok: false, message: "Escribe un codigo de barra valido." }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({
    where: { barcode },
    select: { id: true, name: true, sku: true, barcode: true },
  });

  if (existing) {
    return NextResponse.json({
      ok: true,
      source: "Local",
      existing,
      message: "Este codigo ya existe en el inventario.",
    });
  }

  try {
    const barcodeLookupResult = await fetchBarcodeLookupProduct(barcode);
    if (barcodeLookupResult?.ok) {
      return NextResponse.json({
        ok: true,
        source: "Barcode Lookup",
        product: barcodeLookupResult.product,
      });
    }
    if (barcodeLookupResult && !barcodeLookupResult.ok && barcodeLookupResult.status !== 404) {
      return NextResponse.json({
        ok: false,
        source: "Barcode Lookup",
        message: barcodeLookupResult.message,
      }, { status: barcodeLookupResult.status });
    }

    const upcItemDbResult = await fetchUpcItemDbProduct(barcode);
    if (upcItemDbResult?.ok) {
      return NextResponse.json({
        ok: true,
        source: "UPCitemdb",
        product: upcItemDbResult.product,
      });
    }
    if (upcItemDbResult && !upcItemDbResult.ok) {
      return NextResponse.json({
        ok: false,
        source: "UPCitemdb",
        message: upcItemDbResult.message,
      }, { status: upcItemDbResult.status });
    }

    return NextResponse.json({
      ok: false,
      source: process.env.BARCODE_LOOKUP_API_KEY ? "Barcode Lookup / UPCitemdb" : "UPCitemdb",
      message: "No encontramos datos para ese codigo. Puedes cargarlo manualmente.",
    }, { status: 404 });
  } catch (error) {
    console.error("[api/products/barcode-lookup]", error);
    return NextResponse.json({
      ok: false,
      source: "Barcode Lookup / UPCitemdb",
      message: "No pudimos conectar con los proveedores de codigos. Puedes crear el producto manualmente.",
    }, { status: 502 });
  }
}
