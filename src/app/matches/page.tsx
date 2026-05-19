import { getAllMatchesWithTeams } from "@/server/queries/matches";
import { MatchCard } from "@/components/match/match-card";
import { EditableMatchCard } from "@/components/match/editable-match-card";

export default async function MatchesPage() {
  const matches = await getAllMatchesWithTeams();
  const live = matches.filter((m) => m.status === "live");
  const finished = matches.filter((m) => m.status === "finished");
  const upcoming = matches.filter((m) => m.status === "scheduled");

  // userPredictions vendrá de queries en próxima iteración. Por ahora vacío.
  const userPredictions: Record<string, never> = {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">PARTIDOS</h1>
        <p className="text-muted-foreground mt-1">
          Todos los partidos del Mundial.
        </p>
      </header>

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
    </div>
  );
}
