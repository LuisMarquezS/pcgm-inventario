"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "night" | "day";

const storageKey = "pcgm-theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("theme-day", theme === "day");
  document.documentElement.classList.toggle("theme-night", theme === "night");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("night");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const saved = localStorage.getItem(storageKey);
      const nextTheme: ThemeMode = saved === "day" ? "day" : "night";
      setTheme(nextTheme);
      applyTheme(nextTheme);
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "night" ? "day" : "night";
    setTheme(nextTheme);
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3 text-sm font-semibold text-slate-100 transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-cyan-300"
      aria-label={theme === "night" ? "Cambiar a tema dia" : "Cambiar a tema noche"}
      title={theme === "night" ? "Cambiar a tema dia" : "Cambiar a tema noche"}
    >
      {theme === "night" ? <Moon size={17} /> : <Sun size={17} />}
      <span className="hidden sm:inline">{theme === "night" ? "Noche" : "Dia"}</span>
    </button>
  );
}
