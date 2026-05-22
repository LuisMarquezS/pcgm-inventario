import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const saleSchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  customerDocument: z.string().trim().optional(),
  customerAddress: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z.array(saleItemSchema).min(1, "El carrito esta vacio"),
});
