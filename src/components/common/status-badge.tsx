import { cn } from "@/lib/utils";

type Status = "exact" | "sign" | "wrong" | "pending" | "live" | "loaded";

const config: Record<
  Status,
  { label: string; classes: string; pulse?: boolean }
> = {
  exact: {
    label: "+3 EXACTO",
    classes: "bg-accent text-accent-foreground border-accent",
  },
  sign: {
    label: "+1 SIGNO",
    classes:
      "bg-[color:var(--correct-sign)] text-white border-[color:var(--correct-sign)]",
  },
  wrong: {
    label: "0 PTS",
    classes:
      "bg-[color:var(--wrong)] text-white border-[color:var(--wrong)]",
  },
  pending: {
    label: "PENDIENTE",
    classes:
      "bg-transparent text-muted-foreground border-muted-foreground/40",
  },
  loaded: {
    label: "✓ CARGADO",
    classes:
      "bg-[color:var(--correct-sign)]/15 text-[color:var(--correct-sign)] border-[color:var(--correct-sign)]/40",
  },
  live: {
    label: "EN VIVO",
    classes:
      "bg-[color:var(--live)] text-white border-[color:var(--live)]",
    pulse: true,
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 border-2 rounded-md text-xs font-bold uppercase tracking-wider",
        c.classes,
        className,
      )}
    >
      {c.pulse && (
        <span className="w-2 h-2 rounded-full bg-white animate-live-pulse" />
      )}
      {c.label}
    </span>
  );
}
