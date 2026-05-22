import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
});
