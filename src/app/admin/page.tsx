import Link from "next/link";
import {
  ClipboardList,
  Coins,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { getUsersByStatus, getApprovedCount } from "@/server/queries/users";
import { getAllMatchesWithTeams } from "@/server/queries/matches";
import { getTournamentConfig } from "@/server/queries/tournament-config";
import { getAuditLogEntries, getAllPayments } from "@/server/queries/admin";

export default async function AdminDashboard() {
  const [pending, matches, config, audit, approved, payments] =
    await Promise.all([
      getUsersByStatus("pending"),
      getAllMatchesWithTeams(),
      getTournamentConfig(),
      getAuditLogEntries(5),
      getApprovedCount(),
      getAllPayments(),
    ]);

  const matchesToReview = matches.filter(
    (m) => m.status === "live" || m.status === "scheduled",
  ).length;
  const unpaid = payments.filter((p) => !p.paid).length;
  const pozoTotal =
    (config?.pozoAmountArs ?? 0) * payments.filter((p) => p.paid).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">DASHBOARD</h1>
        <p className="text-muted-foreground mt-1">
          Resumen del prode. Click en cada card para entrar a la sección.
        </p>
      </header>

      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          href="/admin/users"
          icon={<Users className="w-5 h-5" />}
          label="Usuarios pendientes"
          value={pending.length}
          warn={pending.length > 0}
        />
        <StatCard
          href="/admin/matches"
          icon={<ClipboardList className="w-5 h-5" />}
          label="Partidos por jugar"
          value={matchesToReview}
        />
        <StatCard
          href="/admin/payments"
          icon={<Coins className="w-5 h-5" />}
          label="No pagaron"
          value={unpaid}
          warn={unpaid > 0}
        />
        <StatCard
          href="/admin/audit"
          icon={<ScrollText className="w-5 h-5" />}
          label="Aprobados"
          value={approved}
        />
      </div>

      <section className="rounded-xl border-2 border-border bg-card p-5 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl leading-none">CONFIG</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Parámetros del torneo
            </p>
          </div>
          <Link
            href="/admin/config"
            className="text-xs font-bold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
          >
            <Settings className="w-3 h-3" /> Editar
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <ConfigRow
            label="Pozo por jugador"
            value={`$${(config?.pozoAmountArs ?? 0).toLocaleString("es-AR")} ARS`}
          />
          <ConfigRow
            label="Pozo total (pagado)"
            value={`$${pozoTotal.toLocaleString("es-AR")} ARS`}
          />
          <ConfigRow
            label="Inicio del torneo"
            value={
              config
                ? config.tournamentStartsAt.toLocaleDateString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"
            }
          />
          <ConfigRow
            label="Estado del pozo"
            value={
              config && config.tournamentStartsAt < new Date()
                ? "🔒 Lockeado"
                : "Editable"
            }
          />
        </div>
      </section>

      {audit.length > 0 && (
        <section className="rounded-xl border-2 border-border bg-card p-5 md:p-6">
          <div className="flex items-start justify-between mb-3">
            <h2 className="font-display text-2xl leading-none">
              ÚLTIMAS ACCIONES
            </h2>
            <Link
              href="/admin/audit"
              className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
            >
              Ver todo →
            </Link>
          </div>
          <ul className="divide-y divide-border text-sm">
            {audit.map((e) => (
              <li
                key={e.id}
                className="py-2 flex items-baseline justify-between gap-3"
              >
                <span className="font-semibold uppercase tracking-wide text-xs">
                  {e.action.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {e.createdAt.toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  warn,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border-2 bg-card p-4 hover:shadow-md transition-all block ${
        warn ? "border-accent" : "border-border"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={`font-display text-4xl mt-2 tabular-nums leading-none ${
          warn ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </Link>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-xl mt-0.5">{value}</div>
    </div>
  );
}
