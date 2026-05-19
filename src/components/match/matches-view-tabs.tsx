import Link from "next/link";
import { CalendarDays, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { view: "date", label: "Por fecha", icon: CalendarDays },
  { view: "status", label: "Por estado", icon: ListFilter },
] as const;

export function MatchesViewTabs({ current }: { current: "date" | "status" }) {
  return (
    <nav className="inline-flex items-center gap-1 p-1 rounded-md bg-muted">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = current === t.view;
        return (
          <Link
            key={t.view}
            href={t.view === "date" ? "/matches" : `/matches?view=${t.view}`}
            scroll={false}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="w-4 h-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
