import { AlertCircle } from "lucide-react";
import { getAllMatchesWithTeams } from "@/server/queries/matches";
import { TeamLabel } from "@/components/common/team-label";
import { StatusBadge } from "@/components/common/status-badge";
import { CorrectScoreDialog } from "@/components/admin/correct-score-dialog";
import type { MatchWithTeams } from "@/lib/types";

const FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function AdminMatchesPage() {
  const matches = await getAllMatchesWithTeams();
  const live = matches.filter((m) => m.status === "live");
  const finished = matches.filter((m) => m.status === "finished");
  const scheduled = matches.filter((m) => m.status === "scheduled");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">PARTIDOS</h1>
        <p className="text-muted-foreground mt-1">
          Carga manual de resultados. Al guardar, el partido pasa a{" "}
          <strong>finalizado</strong> y se recalculan los puntos de todos los
          jugadores.
        </p>
      </header>

      {live.length > 0 && (
        <Section title="EN VIVO" matches={live} highlight />
      )}
      {scheduled.length > 0 && (
        <Section title="PRÓXIMOS" matches={scheduled} muted />
      )}
      {finished.length > 0 && (
        <Section title="FINALIZADOS" matches={finished} />
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
  matches: MatchWithTeams[];
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl mb-3">
        {title}{" "}
        <span className="text-muted-foreground text-base tabular-nums">
          ({list.length})
        </span>
      </h2>
      <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
        {list.map((m, i) => (
          <div
            key={m.id}
            className={`border-b border-border last:border-b-0 px-4 py-3 flex items-center gap-3 md:gap-4 ${
              highlight ? "bg-[color:var(--live)]/5" : ""
            } ${muted ? "opacity-90" : ""} ${
              i % 2 === 1 && !highlight ? "bg-muted/20" : ""
            }`}
          >
            <div className="hidden md:block text-xs text-muted-foreground w-36 shrink-0">
              <div className="font-bold uppercase tracking-wider">
                Grupo {m.groupLetter}
              </div>
              <div className="mt-0.5">{FORMAT.format(m.kickoffAt)}</div>
            </div>

            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
              <div className="text-right">
                <TeamLabel team={m.homeTeam} size="sm" />
              </div>
              <div className="font-display text-2xl md:text-3xl tabular-nums text-center min-w-[80px]">
                {m.homeScore !== null && m.awayScore !== null ? (
                  <>
                    {m.homeScore}
                    <span className="text-muted-foreground mx-1">-</span>
                    {m.awayScore}
                  </>
                ) : (
                  <span className="text-muted-foreground/40 text-base">
                    — vs —
                  </span>
                )}
              </div>
              <div>
                <TeamLabel team={m.awayTeam} size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {m.status === "live" && <StatusBadge status="live" />}
              <CorrectScoreDialog match={m} />
            </div>
          </div>
        ))}
      </div>

      {highlight && (
        <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Guardar el resultado dispara el recálculo de puntos.
        </p>
      )}
    </section>
  );
}
