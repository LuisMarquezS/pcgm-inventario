import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "green" | "magenta" | "yellow" | "red" | "muted" }) {
  return (
    <span
      className={cn(
        "ui-badge inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4",
        tone === "cyan" && "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
        tone === "green" && "border-lime-300/30 bg-lime-300/10 text-lime-200",
        tone === "magenta" && "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200",
        tone === "yellow" && "border-amber-300/30 bg-amber-300/10 text-amber-200",
        tone === "red" && "border-rose-300/30 bg-rose-300/10 text-rose-200",
        tone === "muted" && "border-white/10 bg-white/5 text-slate-300",
      )}
    >
      {children}
    </span>
  );
}
