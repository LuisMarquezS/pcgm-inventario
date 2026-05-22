import Link from "next/link";
import { Boxes, Gauge, Layers3, Settings, ShoppingCart, Upload, WalletCards } from "lucide-react";
import { CartHeaderButton } from "@/components/cart/cart-header-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { prisma } from "@/lib/prisma";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/products", label: "Inventario", icon: Boxes },
  { href: "/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/categories", label: "Categorias", icon: Layers3 },
  { href: "/exchange-rates", label: "Tasas", icon: WalletCards },
  { href: "/import-export", label: "Importar/Exportar", icon: Upload },
  { href: "/settings", label: "Configuracion", icon: Settings },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const settings = await prisma.settings.findFirst();

  return (
    <div className="app-shell-root min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_32%),#020617] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="app-sidebar hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/80 p-5 lg:block">
          <Link href="/dashboard" className="mb-8 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-cyan-400 font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.35)]">PC</div>
            <div>
              <p className="text-sm text-cyan-200">Inventario local</p>
              <h1 className="app-strong font-bold text-white">{settings?.storeName ?? "PC Gamer Margarita"}</h1>
            </div>
          </Link>
          <nav className="grid gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="app-nav-link flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white">
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <header className="app-header sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">PC Gamer Margarita</p>
                <p className="text-sm text-slate-400">Panel rapido para stock, precios y tasas</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <CartHeaderButton />
              </div>
              <div className="flex gap-2 overflow-x-auto lg:hidden">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </header>
          <div className="px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
