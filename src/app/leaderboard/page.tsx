import { Coins, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { getLeaderboard } from "@/server/queries/leaderboard";
import { getTournamentConfig } from "@/server/queries/tournament-config";
import { getApprovedCount } from "@/server/queries/users";
import { PositionMedal } from "@/components/leaderboard/position-medal";
import { UserAvatar } from "@/components/common/user-avatar";

export default async function LeaderboardPage() {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const [rows, config, approvedCount] = await Promise.all([
    getLeaderboard(),
    getTournamentConfig(),
    getApprovedCount(),
  ]);

  const pozoArs = config?.pozoAmountArs ?? 0;
  const pozoTotal = pozoArs * approvedCount;
  const tournamentStarted = config
    ? config.tournamentStartsAt.getTime() <= Date.now()
    : false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">
            TABLA DE POSICIONES
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistema clásico: 3 pts exacto, 1 pt signo acertado.
          </p>
        </div>

        <div className="flex gap-3">
          <StatPill
            icon={<Coins className="w-4 h-4" />}
            label="Pozo total"
            value={`$${pozoTotal.toLocaleString("es-AR")}`}
          />
          <StatPill
            icon={<Users className="w-4 h-4" />}
            label="Jugadores"
            value={`${approvedCount}`}
          />
        </div>
      </header>

      {!tournamentStarted && (
        <div className="rounded-lg border-2 border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          El Mundial todavía no empezó. La tabla se va a actualizar cuando se
          jueguen los primeros partidos.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Todavía no hay jugadores aprobados.
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-hidden rounded-lg border-2 border-border bg-card">
            <table className="w-full tabular-nums">
              <thead className="bg-secondary text-secondary-foreground">
                <tr className="text-left text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 w-16 text-center">#</th>
                  <th className="px-4 py-3">Jugador</th>
                  <th className="px-4 py-3 text-right">Puntos</th>
                  <th className="px-4 py-3 text-right">Exactos</th>
                  <th className="px-4 py-3 text-right">Signos</th>
                  <th className="px-4 py-3 text-right">Errados</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isCurrent = row.userId === currentUserId;
                  return (
                    <tr
                      key={row.userId}
                      className={cn(
                        "border-t border-border transition-colors",
                        isCurrent && "bg-primary/5",
                        !isCurrent && idx % 2 === 1 && "bg-muted/30",
                      )}
                    >
                      <td className="px-4 py-3 text-center">
                        <PositionMedal rank={row.rank} isTied={row.isTied} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={row.image}
                            name={row.name}
                            size="md"
                          />
                          <div>
                            <div className="font-display text-xl uppercase leading-none">
                              {row.name}
                              {isCurrent && (
                                <span className="ml-2 font-sans text-xs font-bold text-primary lowercase">
                                  (vos)
                                </span>
                              )}
                            </div>
                            {row.isTied && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                empate
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-display text-3xl text-primary">
                          {row.totalPoints}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {row.exactCount}
                      </td>
                      <td className="px-4 py-3 text-right">{row.signCount}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {row.wrongCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {rows.map((row) => {
              const isCurrent = row.userId === currentUserId;
              return (
                <article
                  key={row.userId}
                  className={cn(
                    "rounded-lg border-2 bg-card p-3 flex items-center gap-3",
                    isCurrent ? "border-primary" : "border-border",
                  )}
                >
                  <PositionMedal rank={row.rank} isTied={row.isTied} />
                  <UserAvatar src={row.image} name={row.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-xl uppercase truncate">
                        {row.name}
                      </span>
                      {isCurrent && (
                        <span className="text-xs font-bold text-primary">
                          (vos)
                        </span>
                      )}
                      {row.isTied && (
                        <span className="text-xs text-muted-foreground">
                          empate
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {row.exactCount} ex · {row.signCount} sg ·{" "}
                      {row.wrongCount} er
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl text-primary leading-none tabular-nums">
                      {row.totalPoints}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      pts
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <footer className="text-xs text-muted-foreground text-center pt-4">
        Empates en puntos → desempata por exactos, luego por signos. Si
        persiste: posición compartida y el pozo se reparte en partes iguales.
      </footer>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex-1 md:flex-initial rounded-md border-2 border-border bg-card px-4 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl text-primary leading-none mt-0.5 tabular-nums">
        {value}
      </div>
    </div>
  );
}
