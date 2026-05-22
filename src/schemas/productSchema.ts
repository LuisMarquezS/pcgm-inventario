import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().trim().optional(),
  name: z.string().trim().min(1, "El nombre es requerido"),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  condition: z.enum(["NEW", "REFURBISHED"], "La condicion es requerida"),
  imageUrl: z.string().trim().optional(),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  minStock: z.coerce.number().int().min(0, "El stock minimo no puede ser negativo"),
  costUSD: z.coerce.number().min(0, "El costo no puede ser negativo"),
  baseSalePriceUSD: z.coerce.number().min(0, "El precio no puede ser negativo"),
  bcvRate: z.coerce.number().positive("La tasa BCV debe ser mayor que 0"),
  parallelRate: z.coerce.number().positive("La tasa Binance debe ser mayor que 0"),
  categoryId: z.string().min(1, "La categoria es requerida"),
  isActive: z.coerce.boolean().default(true),
});
