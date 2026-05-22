import { Badge } from "@/components/ui/badge";

export function ProductBadges({ stock, minStock, imageUrl, isActive }: { stock: number; minStock: number; imageUrl: string | null; isActive: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {stock <= 0 ? <Badge tone="red">Agotado</Badge> : stock <= minStock ? <Badge tone="yellow">Bajo stock</Badge> : <Badge tone="green">Disponible</Badge>}
      {!imageUrl ? <Badge tone="muted">Sin foto</Badge> : null}
      {!isActive ? <Badge tone="muted">Inactivo</Badge> : null}
    </div>
  );
}
