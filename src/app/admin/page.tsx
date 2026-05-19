import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Coins,
  Settings,
  Users,
  ScrollText,
} from "lucide-react";
import {
  pendingUsers,
  matches,
  leaderboard,
  apiSportsUsage,
  auditLog,
  tournamentConfig,
} from "@/lib/mock-data";

export default function AdminDashboard() {
  const matchesToReview = matches.filter(
    (m) => m.status === "live" || m.status === "finished",
  ).length;
  const unpaid = leaderboard.filter((r) => !r.hasPaid).length;
  const apiPercent = Math.round(
    (apiSportsUsage.todayCount / apiSportsUsage.dailyLimit) * 100,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">DASHBOARD</h1>
        <p className="text-muted-foreground mt-1">
          Resumen general del prode. Hacé click en cada card para entrar a la
          sección.
        </p>
      </header>

      {/* Quick stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          href="/admin/users"
          icon={<Users className="w-5 h-5" />}
          label="Usuarios pendientes"
          value={pendingUsers.length}
          warn={pendingUsers.length > 0}
        />
        <StatCard
          href="/admin/matches"
          icon={<ClipboardList className="w-5 h-5" />}
          label="Partidos revisables"
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
          label="Acciones recientes"
          value={auditLog.length}
        />
      </div>

      {/* API usage */}
      <section className="rounded-xl border-2 border-border bg-card p-5 md:p-6">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h2 className="font-display text-2xl leading-none">USO API-SPORTS</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Última sync hace 2 min · plan free
            </p>
          </div>
          {apiPercent >= 80 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/15 text-destructive text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Cerca del límite
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-display text-5xl text-primary tabular-nums leading-none">
            {apiSportsUsage.todayCount}
          </span>
          <span className="text-muted-foreground">
            / {apiSportsUsage.dailyLimit} requests hoy
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              apiPercent >= 80
                ? "bg-destructive"
                : apiPercent >= 60
                  ? "bg-accent"
                  : "bg-[color:var(--correct-sign)]"
            }`}
            style={{ width: `${apiPercent}%` }}
          />
        </div>
      </section>

      {/* Tournament config snapshot */}
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
            className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
          >
            Editar →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <ConfigRow
            label="Pozo por jugador"
            value={`$${tournamentConfig.pozoAmountArs.toLocaleString("es-AR")} ARS`}
          />
          <ConfigRow
            label="Pozo total (recaudado)"
            value={`$${(tournamentConfig.pozoAmountArs * tournamentConfig.paidCount).toLocaleString("es-AR")} ARS`}
          />
          <ConfigRow
            label="Inicio del torneo"
            value={tournamentConfig.tournamentStartsAt.toLocaleDateString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          />
          <ConfigRow
            label="Estado del pozo"
            value={
              tournamentConfig.tournamentStartsAt < new Date()
                ? "🔒 Lockeado"
                : "Editable"
            }
          />
        </div>
      </section>

      {/* Acciones rápidas */}
      <section>
        <h2 className="font-display text-2xl mb-3">ACCIONES RÁPIDAS</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <QuickAction
            href="/admin/users"
            label={`Aprobar ${pendingUsers.length} pendientes`}
            description="Revisa nuevas solicitudes"
          />
          <QuickAction
            href="/admin/matches"
            label="Corregir resultado"
            description="Override manual si la API se equivocó"
          />
          <QuickAction
            href="/admin/config"
            label="Configurar pozo"
            description={`Hoy: $${tournamentConfig.pozoAmountArs.toLocaleString("es-AR")}`}
          />
        </div>
      </section>
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

function QuickAction({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border-2 border-border bg-card p-4 hover:border-primary transition-colors block"
    >
      <div className="font-bold uppercase tracking-wide">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{description}</div>
    </Link>
  );
}
