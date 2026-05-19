/**
 * Sistema de puntaje del Prode 2026 — clásico argentino 3/1.
 *
 * - 3 pts: resultado exacto (predijiste 2-1, salió 2-1)
 * - 1 pt: signo acertado (gana local / empate / gana visitante) sin score exacto
 * - 0 pts: signo errado
 *
 * Para KO: predicción es a los 90 min. Alargue/penales NO cuentan.
 * Si el partido va a definición y vos predijiste empate y terminó empate,
 * cobrás como empate (los penales son aparte).
 *
 * Esta función es PURA. No lee DB. Testeable trivialmente.
 */

export type ScoreInput = {
  homeScore: number;
  awayScore: number;
};

export const POINTS_EXACT = 3;
export const POINTS_SIGN = 1;
export const POINTS_WRONG = 0;

/**
 * Calcula los puntos de un pronóstico vs el resultado real.
 *
 * @param prediction El pronóstico del jugador (homeScore, awayScore a 90 min)
 * @param result El resultado real (homeScore, awayScore a 90 min)
 * @returns 3 si exacto, 1 si signo, 0 si erró
 */
export function calculateMatchPoints(
  prediction: ScoreInput,
  result: ScoreInput,
): number {
  // Exacto
  if (
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore
  ) {
    return POINTS_EXACT;
  }

  // Signo (resultado del partido: gana local / empate / gana visitante)
  const predSign = Math.sign(prediction.homeScore - prediction.awayScore);
  const realSign = Math.sign(result.homeScore - result.awayScore);

  return predSign === realSign ? POINTS_SIGN : POINTS_WRONG;
}

/**
 * Devuelve el "tipo" del resultado para UI/badges.
 */
export function classifyPrediction(
  prediction: ScoreInput,
  result: ScoreInput,
): "exact" | "sign" | "wrong" {
  const points = calculateMatchPoints(prediction, result);
  if (points === POINTS_EXACT) return "exact";
  if (points === POINTS_SIGN) return "sign";
  return "wrong";
}

// ============================================================
// Bonus por pronósticos especiales (pre-torneo)
// ============================================================

export const BONUS_POINTS = {
  champion: 20,
  runnerUp: 10,
  thirdPlace: 5,
  topScorer: 15,
  bestPlayer: 10,
  mostGoalsTeam: 5,
} as const;

export type SpecialPicks = {
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  thirdPlaceTeamId: string | null;
  topScorerPlayerId: string | null;
  bestPlayerId: string | null;
  mostGoalsTeamId: string | null;
};

export type SpecialResults = {
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  thirdPlaceTeamId: string | null;
  topScorerPlayerId: string | null;
  bestPlayerId: string | null;
  mostGoalsTeamId: string | null;
};

/**
 * Total de puntos bonus por aciertos en los 6 picks especiales.
 * Cada pick es independiente; sumamos los que acertó.
 */
export function calculateBonusPoints(
  picks: SpecialPicks,
  results: SpecialResults,
): number {
  let total = 0;
  if (picks.championTeamId && picks.championTeamId === results.championTeamId) {
    total += BONUS_POINTS.champion;
  }
  if (picks.runnerUpTeamId && picks.runnerUpTeamId === results.runnerUpTeamId) {
    total += BONUS_POINTS.runnerUp;
  }
  if (
    picks.thirdPlaceTeamId &&
    picks.thirdPlaceTeamId === results.thirdPlaceTeamId
  ) {
    total += BONUS_POINTS.thirdPlace;
  }
  if (
    picks.topScorerPlayerId &&
    picks.topScorerPlayerId === results.topScorerPlayerId
  ) {
    total += BONUS_POINTS.topScorer;
  }
  if (picks.bestPlayerId && picks.bestPlayerId === results.bestPlayerId) {
    total += BONUS_POINTS.bestPlayer;
  }
  if (
    picks.mostGoalsTeamId &&
    picks.mostGoalsTeamId === results.mostGoalsTeamId
  ) {
    total += BONUS_POINTS.mostGoalsTeam;
  }
  return total;
}

export const MAX_POSSIBLE_BONUS =
  BONUS_POINTS.champion +
  BONUS_POINTS.runnerUp +
  BONUS_POINTS.thirdPlace +
  BONUS_POINTS.topScorer +
  BONUS_POINTS.bestPlayer +
  BONUS_POINTS.mostGoalsTeam;
// = 65
