import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { calculateMatchPoints } from "@/lib/scoring";

/**
 * Recalcula los puntos de todos los pronósticos de un match.
 * Idempotente: se puede correr cualquier cantidad de veces, siempre da el
 * mismo resultado. Se invoca cuando:
 * 1. El match transiciona a `finished`
 * 2. El admin corrige el score
 *
 * Si el match NO está finished, setea points = null para todos los
 * pronósticos (defensivo).
 */
export async function recalculateForMatch(matchId: string): Promise<void> {
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    columns: { id: true, status: true, homeScore: true, awayScore: true },
  });
  if (!match) return;

  // Si el match no está finished o no tiene score, todos vuelven a points=null
  if (
    match.status !== "finished" ||
    match.homeScore === null ||
    match.awayScore === null
  ) {
    await db
      .update(predictions)
      .set({ points: null })
      .where(eq(predictions.matchId, matchId));
    return;
  }

  const result = { homeScore: match.homeScore, awayScore: match.awayScore };

  // Traer todos los pronósticos del match y calcular sus puntos.
  // Para 15 usuarios es una sola query + 15 updates. No vale la pena
  // optimizar con un solo UPDATE...CASE.
  const preds = await db.query.predictions.findMany({
    where: eq(predictions.matchId, matchId),
    columns: { id: true, homeScore: true, awayScore: true },
  });

  for (const p of preds) {
    const points = calculateMatchPoints(
      { homeScore: p.homeScore, awayScore: p.awayScore },
      result,
    );
    await db
      .update(predictions)
      .set({ points })
      .where(eq(predictions.id, p.id));
  }
}

/**
 * Re-calcula los puntos de TODOS los matches finalizados. "Panic button".
 * Útil si:
 * - Se cambió el algoritmo de scoring (post-deploy)
 * - Se detectó inconsistencia
 * - Se aplicaron correcciones masivas
 */
export async function recalculateAll(): Promise<{ matchesProcessed: number }> {
  const finished = await db.query.matches.findMany({
    where: and(
      eq(matches.status, "finished"),
      isNotNull(matches.homeScore),
      isNotNull(matches.awayScore),
    ),
    columns: { id: true },
  });

  for (const m of finished) {
    await recalculateForMatch(m.id);
  }

  return { matchesProcessed: finished.length };
}
