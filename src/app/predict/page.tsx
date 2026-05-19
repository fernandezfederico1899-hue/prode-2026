import { matches, userPredictions } from "@/lib/mock-data";
import { MatchCard } from "@/components/match/match-card";
import { EditableMatchCard } from "@/components/match/editable-match-card";

export default function PredictPage() {
  // Editables: podés cargar/cambiar el pronóstico (no empezó todavía)
  const editable = matches.filter((m) => m.status === "scheduled");
  const pending = editable.filter((m) => !userPredictions[m.id]);
  const loaded = editable.filter((m) => userPredictions[m.id]);

  // En vivo: ya está lockeado pero todavía no terminó
  const live = matches
    .filter((m) => m.status === "live")
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());

  // Histórico: finalizados, read-only
  const finished = matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime());

  // Total de puntos del usuario en finalizados (para el header del histórico)
  const finishedPoints = finished.reduce(
    (acc, m) => acc + (userPredictions[m.id]?.points ?? 0),
    0,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">MIS PRONÓSTICOS</h1>
          <p className="text-muted-foreground mt-1">
            Cargá tu pronóstico para cada partido antes del kickoff.
          </p>
        </div>
        <a
          href="/specials"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border-2 border-accent bg-accent/10 text-accent font-bold uppercase tracking-wide text-sm hover:bg-accent/20 transition-colors self-start"
        >
          🏆 Especiales
        </a>
      </header>

      {pending.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">
            POR CARGAR{" "}
            <span className="text-primary tabular-nums">
              ({pending.length})
            </span>
          </h2>
          <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pending.map((m) => (
              <EditableMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {loaded.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">
            CARGADOS{" "}
            <span className="text-muted-foreground tabular-nums">
              ({loaded.length})
            </span>
          </h2>
          <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loaded.map((m) => (
              <EditableMatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
              />
            ))}
          </div>
        </section>
      )}

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
