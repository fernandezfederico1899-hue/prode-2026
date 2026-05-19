"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/common/theme-toggle";

const items = [
  { href: "/", label: "Inicio" },
  { href: "/predict", label: "Pronósticos" },
  { href: "/groups", label: "Grupos" },
  { href: "/bracket", label: "Llave" },
  { href: "/agenda", label: "Agenda" },
  { href: "/leaderboard", label: "Tabla" },
  { href: "/profile", label: "Perfil" },
];

export function NavDesktop() {
  const pathname = usePathname();

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-card border-b-2 border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-3xl leading-none text-primary">
            PRODE
          </span>
          <span className="font-display text-3xl leading-none text-foreground">
            2026
          </span>
        </Link>

        <nav>
          <ul className="flex items-center gap-1">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
