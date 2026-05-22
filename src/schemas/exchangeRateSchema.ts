import { z } from "zod";

export const exchangeRateSchema = z.object({
  bcvRate: z.coerce.number().positive("La tasa BCV debe ser mayor que 0"),
  parallelRate: z.coerce.number().positive("La tasa Binance debe ser mayor que 0"),
  source: z.string().default("Manual"),
  notes: z.string().optional(),
});
