import { cn } from "@/lib/utils";
import type { GroupStanding } from "@/lib/mock-data";
import { TeamLabel } from "@/components/common/team-label";

export function GroupCard({
  letter,
  standings,
}: {
  letter: string;
  standings: GroupStanding[];
}) {
  return (
    <article className="rounded-xl border-2 border-border bg-card overflow-hidden">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground px-4 py-3 flex items-baseline justify-between">
        <h3 className="font-display text-2xl md:text-3xl leading-none">
          GRUPO {letter}
        </h3>
        <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">
          {standings[0]?.played ?? 0} fechas jugadas
        </span>
      </header>

      {/* Standings table */}
      <div className="overflow-hidden">
        <table className="w-full tabular-nums text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/40">
            <tr>
              <th className="text-center w-8 py-2">#</th>
              <th className="text-left py-2">Equipo</th>
              <th className="text-center w-8 py-2" title="Partidos jugados">PJ</th>
              <th className="text-center w-8 py-2" title="Ganados">G</th>
              <th className="text-center w-8 py-2" title="Empatados">E</th>
              <th className="text-center w-8 py-2" title="Perdidos">P</th>
              <th className="text-center w-12 py-2" title="Goles a favor / en contra">
                GF:GC
              </th>
              <th className="text-center w-10 py-2 pr-3" title="Puntos">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const passes = idx < 2; // top 2 pasan a octavos
              return (
                <tr
                  key={s.team.id}
                  className={cn(
                    "border-t border-border/60",
                    passes && "bg-accent/10",
                  )}
                >
                  <td className="text-center py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                        passes
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <TeamLabel team={s.team} size="sm" />
                  </td>
                  <td className="text-center py-2.5">{s.played}</td>
                  <td className="text-center py-2.5">{s.wins}</td>
                  <td className="text-center py-2.5">{s.draws}</td>
                  <td className="text-center py-2.5">{s.losses}</td>
                  <td className="text-center py-2.5 text-xs">
                    {s.goalsFor}
                    <span className="text-muted-foreground">:</span>
                    {s.goalsAgainst}
                  </td>
                  <td className="text-center py-2.5 pr-3">
                    <span className="font-display text-xl text-primary leading-none">
                      {s.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <footer className="px-4 py-2 bg-muted/30 border-t border-border text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-accent" />
        Clasifica a octavos
      </footer>
    </article>
  );
}
