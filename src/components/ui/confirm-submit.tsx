"use client";

import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function ConfirmSubmit({ children, message, variant = "secondary" }: { children: ReactNode; message: string; variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <Button
      type="submit"
      variant={variant}
      onClick={(event) => {
        if (!confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
