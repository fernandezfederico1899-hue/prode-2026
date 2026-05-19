"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Coins,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/matches", label: "Partidos", icon: ClipboardList },
  { href: "/admin/payments", label: "Pagos", icon: Coins },
  { href: "/admin/config", label: "Config", icon: Settings },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
];

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b-2 border-border bg-card">
      <div className="max-w-6xl mx-auto px-2 md:px-4 overflow-x-auto">
        <ul className="flex items-stretch min-w-max gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
