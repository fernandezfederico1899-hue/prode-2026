"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ListChecks,
  Trophy,
  CalendarDays,
  User,
  LayoutGrid,
  Goal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/predict", label: "Pronós.", icon: ListChecks },
  { href: "/groups", label: "Grupos", icon: LayoutGrid },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/matches", label: "Partidos", icon: Goal },
  { href: "/leaderboard", label: "Tabla", icon: Trophy },
  { href: "/profile", label: "Perfil", icon: User },
];

const HIDDEN_ON = ["/login", "/pending", "/rejected", "/champion"];

export function NavMobile() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t-2 border-border">
      <ul className="flex items-stretch">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 min-h-[60px] text-[10px] font-semibold",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="uppercase tracking-wide truncate max-w-full px-1">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
