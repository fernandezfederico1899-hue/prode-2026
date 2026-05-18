import { matches, userPredictions } from "@/lib/mock-data";
import { MatchCard } from "@/components/match/match-card";

export default function PredictPage() {
  const editable = matches.filter(
    (m) => m.status === "scheduled" || m.status === "live",
  );
  const pending = editable.filter((m) => !userPredictions[m.id]);
  const loaded = editable.filter((m) => userPredictions[m.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">MIS PRONÓSTICOS</h1>
        <p className="text-muted-foreground mt-1">
          Cargá tu prono para cada partido antes del kickoff.
        </p>
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
              <MatchCard
                key={m.id}
                match={m}
                href={`/predict/${m.id}`}
              />
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
              <MatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
                href={`/predict/${m.id}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
