"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function IconSubmit({
  children,
  label,
  message,
  tone = "neutral",
}: {
  children: ReactNode;
  label: string;
  message?: string;
  tone?: "neutral" | "danger" | "cyan";
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      onClick={(event) => {
        if (message && !confirm(message)) event.preventDefault();
      }}
      className={cn(
        "inline-grid size-8 place-items-center rounded-lg border transition focus:outline-none focus:ring-2",
        tone === "neutral" && "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 focus:ring-slate-300",
        tone === "cyan" && "border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/16 focus:ring-cyan-300",
        tone === "danger" && "border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/16 focus:ring-rose-300",
      )}
    >
      {children}
    </button>
  );
}
