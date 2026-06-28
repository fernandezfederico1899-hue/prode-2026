import { auth } from "@/lib/auth";
import { getAllMatchesWithTeams } from "@/server/queries/matches";
import { getUserPredictionsByMatch } from "@/server/queries/predictions";
import { MatchCard } from "@/components/match/match-card";
import { InlinePredictCard } from "@/components/match/inline-predict-card";
import type { MatchWithTeams, Prediction } from "@/lib/types";

const KO_STAGE_LABELS: Record<string, string> = {
  round_of_32: "16AVOS",
  round_of_16: "OCTAVOS",
  quarter: "CUARTOS",
  semi: "SEMIS",
  third_place: "3° PUESTO",
  final: "FINAL",
};
const KO_STAGE_ORDER = [
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
];

export default async function PredictPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const [matches, userPredictions] = await Promise.all([
    getAllMatchesWithTeams(),
    userId
      ? getUserPredictionsByMatch(userId)
      : Promise.resolve({} as Record<string, never>),
  ]);

  // Editables: podés cargar/cambiar el pronóstico (no empezó todavía)
  const editable = matches.filter((m) => m.status === "scheduled");

  // Agrupar por grupo (A-L) los partidos de fase de grupos.
  const groupEditable: Record<string, MatchWithTeams[]> = {};
  for (const m of editable) {
    if (m.stage === "group" && m.groupLetter) {
      if (!groupEditable[m.groupLetter]) groupEditable[m.groupLetter] = [];
      groupEditable[m.groupLetter].push(m);
    }
  }
  for (const list of Object.values(groupEditable)) {
    list.sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
  }
  const groupLetters = Object.keys(groupEditable).sort();

  // KO editables agrupados por stage (solo los que ya tienen los 2 teams asignados).
  const koEditable: Record<string, MatchWithTeams[]> = {};
  for (const m of editable) {
    if (m.stage !== "group") {
      if (!koEditable[m.stage]) koEditable[m.stage] = [];
      koEditable[m.stage].push(m);
    }
  }
  for (const list of Object.values(koEditable)) {
    list.sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
  }

  // En vivo: ya está lockeado pero todavía no terminó
  const live = matches
    .filter((m) => m.status === "live")
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());

  // Histórico: finalizados, read-only
  const finished = matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime());

  const finishedPoints = finished.reduce(
    (acc, m) => acc + (userPredictions[m.id]?.points ?? 0),
    0,
  );
  const totalLoaded = editable.filter((m) => userPredictions[m.id]).length;
  const totalEditable = editable.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">MIS PRONÓSTICOS</h1>
          <p className="text-muted-foreground mt-1">
            Cargá tu pronóstico para cada partido antes del kickoff.{" "}
            <span className="font-bold text-foreground tabular-nums">
              {totalLoaded}/{totalEditable}
            </span>{" "}
            cargados.
          </p>
        </div>
        <a
          href="/specials"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border-2 border-accent bg-accent/10 text-accent font-bold uppercase tracking-wide text-sm hover:bg-accent/20 transition-colors self-start"
        >
          🏆 Especiales
        </a>
      </header>

      {groupLetters.map((letter) => (
        <GroupSection
          key={letter}
          letter={letter}
          matches={groupEditable[letter]}
          userPredictions={userPredictions}
        />
      ))}

      {KO_STAGE_ORDER.map((stage) => {
        const list = koEditable[stage];
        if (!list || list.length === 0) return null;
        return (
          <KoSection
            key={stage}
            stage={stage}
            label={KO_STAGE_LABELS[stage]}
            matches={list}
            userPredictions={userPredictions}
          />
        );
      })}

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

      {finished.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl">
              HISTÓRICO{" "}
              <span className="text-muted-foreground tabular-nums">
                ({finished.length})
              </span>
            </h2>
            <span className="text-sm text-muted-foreground">
              Total:{" "}
              <span className="font-display text-2xl text-primary tabular-nums">
                {finishedPoints}
              </span>{" "}
              pts
            </span>
          </div>
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

function GroupSection({
  letter,
  matches,
  userPredictions,
}: {
  letter: string;
  matches: MatchWithTeams[];
  userPredictions: Record<string, Prediction>;
}) {
  const loaded = matches.filter((m) => userPredictions[m.id]).length;
  const total = matches.length;
  const allDone = loaded === total;

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3 md:mb-4 border-b-2 border-border pb-2">
        <h2 className="font-display text-2xl md:text-3xl">GRUPO {letter}</h2>
        <span
          className={`text-sm font-bold tabular-nums ${
            allDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          }`}
        >
          {loaded}/{total} {allDone && "✓"}
        </span>
      </header>
      <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <InlinePredictCard
            key={m.id}
            match={m}
            userPrediction={userPredictions[m.id]}
          />
        ))}
      </div>
    </section>
  );
}

function KoSection({
  stage: _stage,
  label,
  matches,
  userPredictions,
}: {
  stage: string;
  label: string;
  matches: MatchWithTeams[];
  userPredictions: Record<string, Prediction>;
}) {
  const loaded = matches.filter((m) => userPredictions[m.id]).length;
  const total = matches.length;
  const allDone = loaded === total;

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3 md:mb-4 border-b-2 border-primary/40 pb-2">
        <h2 className="font-display text-2xl md:text-3xl text-primary">{label}</h2>
        <span
          className={`text-sm font-bold tabular-nums ${
            allDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          }`}
        >
          {loaded}/{total} {allDone && "✓"}
        </span>
      </header>
      <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <InlinePredictCard
            key={m.id}
            match={m}
            userPrediction={userPredictions[m.id]}
          />
        ))}
      </div>
    </section>
  );
}
