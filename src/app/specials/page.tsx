import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAllTeams } from "@/server/queries/teams";
import { getAllPlayersWithTeam } from "@/server/queries/players";
import { getTournamentConfig } from "@/server/queries/tournament-config";
import { getUserSpecialPicks } from "@/server/queries/specials";
import { SpecialPicksForm } from "@/components/specials/special-picks-form";

export default async function SpecialsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const [teams, players, config, picks] = await Promise.all([
    getAllTeams(),
    getAllPlayersWithTeam(),
    getTournamentConfig(),
    userId ? getUserSpecialPicks(userId) : Promise.resolve(null),
  ]);

  const locked = config
    ? config.tournamentStartsAt.getTime() <= Date.now()
    : false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header className="text-center">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-accent" />
        <h1 className="font-display text-4xl md:text-5xl">
          PRONÓSTICOS ESPECIALES
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Apostá a quién va a ser <strong>campeón</strong>,{" "}
          <strong>goleador</strong>, mejor jugador y más. Suma puntos bonus al
          finalizar el torneo.
        </p>
      </header>

      <SpecialPicksForm
        teams={teams}
        players={players}
        initialPicks={{
          championTeamId: picks?.championTeamId ?? null,
          runnerUpTeamId: picks?.runnerUpTeamId ?? null,
          thirdPlaceTeamId: picks?.thirdPlaceTeamId ?? null,
          mostGoalsTeamId: picks?.mostGoalsTeamId ?? null,
          topScorerPlayerId: picks?.topScorerPlayerId ?? null,
          bestPlayerId: picks?.bestPlayerId ?? null,
        }}
        locked={locked}
      />
    </div>
  );
}
