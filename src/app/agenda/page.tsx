import { matches, userPredictions } from "@/lib/mock-data";
import type { Match } from "@/lib/mock-data";
import { MatchCard } from "@/components/match/match-card";
import { StatusBadge } from "@/components/common/status-badge";

// Render-time: este componente se re-evalúa cada request. Para producción
// vamos a usar Cache Components con cacheLife invalidando a las 00:00 ART
// (mock no necesita, ya es dinámico).
export const dynamic = "force-dynamic";

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

export default function AgendaPage() {
  // Agrupar partidos por fecha ART
  const byDate = new Map<string, { date: Date; matches: Match[] }>();

  for (const m of matches) {
    const key = formatDateKey(m.kickoffAt);
    if (!byDate.has(key)) {
      byDate.set(key, { date: m.kickoffAt, matches: [] });
    }
    byDate.get(key)!.matches.push(m);
  }

  // Ordenar fechas ascendente y dentro de cada fecha por horario
  const sortedDates = Array.from(byDate.entries())
    .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
    .map(([key, val]) => ({
      key,
      date: val.date,
      matches: val.matches.sort(
        (a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime(),
      ),
    }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">AGENDA</h1>
        <p className="text-muted-foreground mt-1">
          Partidos del Mundial por fecha y horario.{" "}
          <span className="text-xs">Horarios en Argentina (GMT-3).</span>
        </p>
      </header>

      {sortedDates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay partidos cargados todavía.
        </div>
      )}

      {sortedDates.map(({ key, date, matches: dayMatches }) => {
        const hasLive = dayMatches.some((m) => m.status === "live");
        const today = isToday(key);

        return (
          <section key={key}>
            <DayHeader
              date={date}
              today={today}
              hasLive={hasLive}
              count={dayMatches.length}
            />
            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
              {dayMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  userPrediction={userPredictions[m.id]}
                  href={`/matches/${m.id}`}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DayHeader({
  date,
  today,
  hasLive,
  count,
}: {
  date: Date;
  today: boolean;
  hasLive: boolean;
  count: number;
}) {
  return (
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
        {count} {count === 1 ? "partido" : "partidos"}
      </span>
    </div>
  );
}
