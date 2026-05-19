import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Trophy } from "lucide-react";

type OFMatch = {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  ground?: string;
};

function loadKnockoutMatches(): OFMatch[] {
  const path = resolve(process.cwd(), "src/data/wc2026.json");
  const raw = readFileSync(path, "utf8");
  const data = JSON.parse(raw) as { matches: OFMatch[] };
  return data.matches.filter((m) => !m.round.startsWith("Matchday"));
}

const STAGE_LABELS: Record<string, string> = {
  "Round of 32": "16avos",
  "Round of 16": "Octavos",
  "Quarter-final": "Cuartos",
  "Semi-final": "Semis",
  "Match for third place": "3° Puesto",
  Final: "Final",
};

const STAGE_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Match for third place",
  "Final",
];

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

function parseKickoff(date: string, time: string): Date | null {
  const match = time.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)$/);
  if (!match) return null;
  const [, hh, mm, off] = match;
  const offsetHours = parseInt(off, 10);
  const localHour = parseInt(hh, 10);
  const utcHour = localHour - offsetHours;
  const [y, m, d] = date.split("-").map((s) => parseInt(s, 10));
  return new Date(Date.UTC(y, m - 1, d, utcHour, parseInt(mm, 10), 0));
}

export default function BracketPage() {
  const koMatches = loadKnockoutMatches();
  const byStage = new Map<string, OFMatch[]>();
  for (const m of koMatches) {
    if (!byStage.has(m.round)) byStage.set(m.round, []);
    byStage.get(m.round)!.push(m);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">LLAVE</h1>
        <p className="text-muted-foreground mt-1">
          Cuadro de eliminatoria del Mundial 2026.{" "}
          <strong>32 partidos KO en 5 rondas</strong>: 16avos → Octavos →
          Cuartos → Semis → 3° + Final. Los equipos se completan cuando termine
          la fase de grupos (a partir del 27/06/2026).
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
                    {STAGE_LABELS[stage] ?? stage}
                  </h3>
                  <div className="flex flex-col gap-3 md:gap-4 flex-1 justify-around">
                    {ms.map((m, i) => {
                      const kickoff = parseKickoff(m.date, m.time);
                      return (
                        <article
                          key={`${stage}-${i}`}
                          className="rounded-md border-2 border-border bg-card overflow-hidden w-[200px] md:w-[220px] shrink-0"
                        >
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-xs italic text-muted-foreground">
                              A definir
                            </span>
                            <span className="font-display text-2xl text-muted-foreground/40">
                              —
                            </span>
                          </div>
                          <div className="h-px bg-border" />
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-xs italic text-muted-foreground">
                              A definir
                            </span>
                            <span className="font-display text-2xl text-muted-foreground/40">
                              —
                            </span>
                          </div>
                          <footer className="px-2.5 py-1.5 bg-muted/30 border-t border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                            {kickoff ? DATE_FORMAT.format(kickoff) : m.date}
                            {m.ground ? ` · ${m.ground}` : ""}
                          </footer>
                        </article>
                      );
                    })}
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
