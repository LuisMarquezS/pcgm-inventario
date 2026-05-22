import { Badge } from "@/components/ui/badge";

export function ConditionBadge({ condition }: { condition?: string | null }) {
  const refurbished = condition === "REFURBISHED";
  return <Badge tone={refurbished ? "magenta" : "cyan"}>{refurbished ? "Refurbished" : "Nuevo"}</Badge>;
}
