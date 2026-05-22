import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(value: number | null | undefined) {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

export function formatBs(value: number | null | undefined) {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value ?? 0);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function productStockStatus(stock: number, minStock: number) {
  if (stock <= 0) return "Agotado";
  if (stock <= minStock) return "Bajo stock";
  return "Disponible";
}
