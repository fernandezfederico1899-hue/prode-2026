import { MatchCard } from "./match-card";
import { PredictSheet } from "./predict-sheet";
import type { MatchWithTeams, Prediction } from "@/lib/types";

/**
 * MatchCard que abre una sheet/dialog inline para cargar o editar el
 * pronóstico al hacer click. Pensado para partidos `scheduled`.
 *
 * En mobile el sheet sube desde abajo; en desktop es un dialog al centro.
 */
export function EditableMatchCard({
  match,
  userPrediction,
}: {
  match: MatchWithTeams;
  userPrediction?: Prediction;
}) {
  return (
    <PredictSheet match={match} initialPrediction={userPrediction}>
      <button
        type="button"
        className="block w-full text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MatchCard match={match} userPrediction={userPrediction} />
      </button>
    </PredictSheet>
  );
}
