import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="ui-label font-medium text-slate-200">{label}</span>
      {children}
      {hint ? <span className="ui-hint text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn("ui-input min-h-10 rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300", props.className)}
    />
  );
}

export function Textarea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn("ui-input min-h-24 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300", props.className)}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn("ui-input min-h-10 rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300", props.className)}
    />
  );
}
