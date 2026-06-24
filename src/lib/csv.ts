import Papa from "papaparse";

export const productCsvHeaders = [
  "ID",
  "SKU",
  "Codigo de barra",
  "Nombre",
  "Marca",
  "Modelo",
  "Condicion",
  "Categoria",
  "Stock actual",
  "Stock tienda",
  "Stock deposito",
  "Stock minimo",
  "Costo USD",
  "Precio base USD",
  "Precio ajustado USD",
  "Precio Bs",
  "Tasa BCV usada",
  "Tasa Binance usada",
  "Ganancia USD",
  "Margen %",
  "Estado",
  "Fecha de creacion",
  "Ultima actualizacion",
];

export type ImportProductRow = {
  nombre?: string;
  marca?: string;
  modelo?: string;
  sku?: string;
  barcode?: string;
  codigoBarra?: string;
  codigoDeBarra?: string;
  codigoBarras?: string;
  codigoDeBarras?: string;
  upc?: string;
  ean?: string;
  categoria?: string;
  condicion?: string;
  estado?: string;
  stock?: string;
  stockTienda?: string;
  stockDeposito?: string;
  tienda?: string;
  deposito?: string;
  d?: string;
  t?: string;
  stockMinimo?: string;
  costoUSD?: string;
  precioVentaBaseUSD?: string;
};

export function parseImportCsv(csv: string) {
  return Papa.parse<ImportProductRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
}

export function toCsv(rows: unknown[]) {
  return Papa.unparse(rows);
}

export function parseProductCondition(value?: string) {
  const normalized = (value || "nuevo").trim().toLowerCase();
  if (["nuevo", "new"].includes(normalized)) return "NEW";
  if (["refurbished", "refurb", "reacondicionado"].includes(normalized)) return "REFURBISHED";
  return null;
}

export function productConditionLabel(condition: string | null | undefined) {
  return condition === "REFURBISHED" ? "Refurbished" : "Nuevo";
}

export function parseProductActiveState(value?: string) {
  const normalized = (value || "activo").trim().toLowerCase();
  if (["activo", "activa", "active", "true", "1", "si", "sí"].includes(normalized)) return true;
  if (["inactivo", "inactiva", "inactive", "false", "0", "no"].includes(normalized)) return false;
  return null;
}
