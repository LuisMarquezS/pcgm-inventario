import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("ui-card rounded-lg border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/20", className)}>
      {children}
    </div>
  );
}
