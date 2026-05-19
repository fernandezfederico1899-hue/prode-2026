import { AlertCircle, Edit2 } from "lucide-react";
import { matches } from "@/lib/mock-data";
import { TeamLabel } from "@/components/common/team-label";
import { StatusBadge } from "@/components/common/status-badge";

const FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default function AdminMatchesPage() {
  const live = matches.filter((m) => m.status === "live");
  const finished = matches.filter((m) => m.status === "finished");
  const scheduled = matches.filter((m) => m.status === "scheduled");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">PARTIDOS</h1>
          <p className="text-muted-foreground mt-1">
            Override manual de resultados. Última sync API-Sports hace 2 min.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border-2 border-border bg-card hover:bg-muted text-sm font-bold uppercase tracking-wide"
          >
            Resync fixture
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border-2 border-accent bg-accent/10 text-accent text-sm font-bold uppercase tracking-wide hover:bg-accent/20"
          >
            Recalcular todo
          </button>
        </div>
      </header>

      {live.length > 0 && (
        <Section title="EN VIVO" matches={live} highlight />
      )}
      {finished.length > 0 && (
        <Section title="FINALIZADOS" matches={finished} />
      )}
      {scheduled.length > 0 && (
        <Section title="PROGRAMADOS" matches={scheduled} muted />
      )}
    </div>
  );
}

function Section({
  title,
  matches: list,
  highlight,
  muted,
}: {
  title: string;
  matches: typeof matches;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl mb-3">{title}</h2>
      <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
        {list.map((m, i) => (
          <div
            key={m.id}
            className={`border-b border-border last:border-b-0 px-4 py-3 flex items-center gap-3 md:gap-4 ${
              highlight ? "bg-[color:var(--live)]/5" : ""
            } ${muted ? "opacity-70" : ""} ${
              i % 2 === 1 && !highlight ? "bg-muted/20" : ""
            }`}
          >
            {/* Fecha + grupo */}
            <div className="hidden md:block text-xs text-muted-foreground w-32 shrink-0">
              <div className="font-bold uppercase tracking-wider">
                {m.stage === "group"
                  ? `Grupo ${m.groupLetter}`
                  : m.stage.replace("_", " ")}
              </div>
              <div className="mt-0.5">{FORMAT.format(m.kickoffAt)}</div>
            </div>

            {/* Teams + score */}
            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
              <div className="text-right">
                <TeamLabel team={m.homeTeam} size="sm" />
              </div>
              <div className="font-display text-2xl md:text-3xl tabular-nums text-center">
                {m.homeScore !== null && m.awayScore !== null ? (
                  <>
                    {m.homeScore}
                    <span className="text-muted-foreground mx-1">-</span>
                    {m.awayScore}
                  </>
                ) : (
                  <span className="text-muted-foreground/40">— vs —</span>
                )}
              </div>
              <div>
                <TeamLabel team={m.awayTeam} size="sm" />
              </div>
            </div>

            {/* Status + actions */}
            <div className="flex items-center gap-2 shrink-0">
              {m.status === "live" && <StatusBadge status="live" />}
              <button
                type="button"
                aria-label="Editar"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border-2 border-border hover:border-primary hover:text-primary transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {highlight && (
        <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Cualquier corrección dispara el recálculo de puntos de todos los jugadores.
        </p>
      )}
    </section>
  );
}
