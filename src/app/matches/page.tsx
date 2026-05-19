import { getAllMatchesWithTeams } from "@/server/queries/matches";
import type { MatchWithTeams } from "@/lib/types";
import { MatchCard } from "@/components/match/match-card";
import { EditableMatchCard } from "@/components/match/editable-match-card";
import { MatchesViewTabs } from "@/components/match/matches-view-tabs";
import { StatusBadge } from "@/components/common/status-badge";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const currentView: "date" | "status" = view === "status" ? "status" : "date";

  const matches = await getAllMatchesWithTeams();
  // userPredictions vendrá de queries cuando wiring exista.
  const userPredictions: Record<string, never> = {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">PARTIDOS</h1>
          <p className="text-muted-foreground mt-1">
            Todos los partidos del Mundial.{" "}
            <span className="text-xs">Horarios en Argentina (GMT-3).</span>
          </p>
        </div>
        <MatchesViewTabs current={currentView} />
      </header>

      {currentView === "date" ? (
        <ByDateView matches={matches} userPredictions={userPredictions} />
      ) : (
        <ByStatusView matches={matches} userPredictions={userPredictions} />
      )}
    </div>
  );
}

// ============================================================
// Vista por estado (live / próximos / finalizados)
// ============================================================
function ByStatusView({
  matches,
  userPredictions,
}: {
  matches: MatchWithTeams[];
  userPredictions: Record<string, never>;
}) {
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
  const finished = matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime());

  return (
    <div className="space-y-8">
      {live.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">EN VIVO</h2>
          <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {live.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
                href={`/matches/${m.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">PRÓXIMOS</h2>
          <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <EditableMatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
              />
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">FINALIZADOS</h2>
          <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {finished.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
                href={`/matches/${m.id}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================
// Vista por fecha (cronológica)
// ============================================================
const DATE_KEY_FORMAT = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DATE_DISPLAY_FORMAT = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function formatDateKey(d: Date) {
  return DATE_KEY_FORMAT.format(d);
}
function formatDateDisplay(d: Date) {
  return DATE_DISPLAY_FORMAT.format(d).toUpperCase();
}
function isToday(key: string) {
  return key === formatDateKey(new Date());
}

function ByDateView({
  matches,
  userPredictions,
}: {
  matches: MatchWithTeams[];
  userPredictions: Record<string, never>;
}) {
  const byDate = new Map<string, { date: Date; matches: MatchWithTeams[] }>();
  for (const m of matches) {
    const key = formatDateKey(m.kickoffAt);
    if (!byDate.has(key)) {
      byDate.set(key, { date: m.kickoffAt, matches: [] });
    }
    byDate.get(key)!.matches.push(m);
  }

  const sortedDates = Array.from(byDate.entries())
    .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
    .map(([key, val]) => ({
      key,
      date: val.date,
      matches: val.matches.sort(
        (a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime(),
      ),
    }));

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay partidos cargados todavía.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map(({ key, date, matches: dayMatches }) => {
        const hasLive = dayMatches.some((m) => m.status === "live");
        const today = isToday(key);

        return (
          <section key={key}>
            <div className="flex items-baseline justify-between gap-3 mb-3 pb-2 border-b-2 border-border">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="font-display text-2xl md:text-3xl leading-none">
                  {formatDateDisplay(date)}
                </h2>
                {today && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                    Hoy
                  </span>
                )}
                {hasLive && <StatusBadge status="live" />}
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold tabular-nums">
                {dayMatches.length}{" "}
                {dayMatches.length === 1 ? "partido" : "partidos"}
              </span>
            </div>

            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
              {dayMatches.map((m) =>
                m.status === "scheduled" ? (
                  <EditableMatchCard
                    key={m.id}
                    match={m}
                    userPrediction={userPredictions[m.id]}
                  />
                ) : (
                  <MatchCard
                    key={m.id}
                    match={m}
                    userPrediction={userPredictions[m.id]}
                    href={`/matches/${m.id}`}
                  />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
