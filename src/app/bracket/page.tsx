import { asc, ne } from "drizzle-orm";
import { Trophy } from "lucide-react";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { formatSlot, matchShortLabel } from "@/lib/bracket-format";

// Render dinámico: los resultados los actualiza el cron de sync (fuera de
// cualquier revalidatePath), así que no podemos prerenderizar.
export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  round_of_32: "16avos",
  round_of_16: "Octavos",
  quarter: "Cuartos",
  semi: "Semis",
  third_place: "3° Puesto",
  final: "Final",
};

const STAGE_ORDER = [
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
];

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function BracketPage() {
  const rows = await db.query.matches.findMany({
    where: ne(matches.stage, "group"),
    orderBy: [asc(matches.kickoffAt)],
    with: { homeTeam: true, awayTeam: true },
  });

  const byStage = new Map<string, typeof rows>();
  for (const m of rows) {
    if (!byStage.has(m.stage)) byStage.set(m.stage, []);
    byStage.get(m.stage)!.push(m);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-4xl md:text-5xl">LLAVE</h1>
        <p className="text-muted-foreground">
          Cuadro oficial del Mundial 2026. <strong>32 partidos en 5 rondas</strong>:
          16avos → Octavos → Cuartos → Semis → 3° + Final.
        </p>
        <p className="text-xs text-muted-foreground">
          A 16avos pasan: los 2 primeros de cada grupo (24 equipos) + los 8
          mejores terceros. Los cruces ya están definidos por FIFA — abajo ves
          de qué grupo viene cada slot.
        </p>
      </header>

      <div className="relative -mx-4 md:mx-0">
        <div className="overflow-x-auto px-4 md:px-0 pb-4">
          <div className="grid grid-cols-[repeat(6,minmax(200px,1fr))] gap-4 md:gap-5 min-w-max md:min-w-0 items-stretch">
            {STAGE_ORDER.map((stage) => {
              const ms = byStage.get(stage) ?? [];
              return (
                <div key={stage} className="flex flex-col gap-3 md:gap-4">
                  <h3 className="font-display text-xl md:text-2xl uppercase tracking-wide text-center sticky top-0 bg-background pb-2 z-10 border-b-2 border-border">
                    {STAGE_LABELS[stage]}
                  </h3>
                  <div className="flex flex-col gap-3 md:gap-4 flex-1 justify-around">
                    {ms.map((m) => (
                      <article
                        key={m.id}
                        className="rounded-md border-2 border-border bg-card overflow-hidden w-[200px] md:w-[220px] shrink-0"
                      >
                        <header className="px-2.5 py-1.5 bg-primary/10 border-b border-border text-[10px] font-bold uppercase tracking-wider text-primary text-center">
                          {matchShortLabel(m.stage, m.matchNum)}
                        </header>
                        <BracketRow
                          team={m.homeTeam}
                          slot={m.homeSlot}
                          score={m.homeScore}
                          finished={m.status === "finished"}
                        />
                        <div className="h-px bg-border" />
                        <BracketRow
                          team={m.awayTeam}
                          slot={m.awaySlot}
                          score={m.awayScore}
                          finished={m.status === "finished"}
                        />
                        <footer className="px-2.5 py-1.5 bg-muted/30 border-t border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                          {DATE_FORMAT.format(m.kickoffAt)}
                          {m.venue ? ` · ${m.venue}` : ""}
                        </footer>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-6 text-center">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-accent" />
        <p className="font-display text-xl md:text-2xl">
          ¿QUIÉN GANA EL MUNDIAL?
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Cargá tu campeón en{" "}
          <a href="/specials" className="text-primary font-bold hover:underline">
            Pronósticos Especiales
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function BracketRow({
  team,
  slot,
  score,
  finished,
}: {
  team: { name: string; fifaCode: string; flagCode: string } | null;
  slot: string | null;
  score: number | null;
  finished: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 gap-2">
      {team ? (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/${team.flagCode}.svg`}
            alt=""
            className="w-5 h-[15px] rounded-sm border border-border object-cover shrink-0"
          />
          <span className="font-bold text-sm truncate">{team.name}</span>
        </div>
      ) : (
        <span className="text-xs italic text-muted-foreground leading-tight">
          {formatSlot(slot)}
        </span>
      )}
      <span
        className={`font-display text-2xl tabular-nums shrink-0 ${
          score === null
            ? "text-muted-foreground/40"
            : finished
              ? ""
              : "text-[color:var(--live)]"
        }`}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}
