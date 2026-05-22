import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.22)] hover:bg-cyan-300",
        variant === "secondary" && "border border-white/10 bg-white/8 text-white hover:bg-white/12",
        variant === "danger" && "bg-fuchsia-600 text-white hover:bg-fuchsia-500",
        variant === "ghost" && "text-slate-200 hover:bg-white/8",
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300",
        variant === "primary" && "bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.22)] hover:bg-cyan-300",
        variant === "secondary" && "border border-white/10 bg-white/8 text-white hover:bg-white/12",
        variant === "danger" && "bg-fuchsia-600 text-white hover:bg-fuchsia-500",
        variant === "ghost" && "text-slate-200 hover:bg-white/8",
        className,
      )}
    >
      {children}
    </Link>
  );
}
