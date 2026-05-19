import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { predictions, type Prediction } from "@/db/schema";

/**
 * Trae todos los pronósticos de un usuario, indexados por matchId
 * para acceso O(1) desde la UI.
 */
export async function getUserPredictionsByMatch(
  userId: string,
): Promise<Record<string, Prediction>> {
  const rows = await db.query.predictions.findMany({
    where: eq(predictions.userId, userId),
  });
  const out: Record<string, Prediction> = {};
  for (const p of rows) out[p.matchId] = p;
  return out;
}

/**
 * Pronóstico específico del user para un match (o null si no cargó).
 */
export async function getUserPredictionForMatch(
  userId: string,
  matchId: string,
): Promise<Prediction | null> {
  const row = await db.query.predictions.findFirst({
    where: (p, { and, eq }) =>
      and(eq(p.userId, userId), eq(p.matchId, matchId)),
  });
  return row ?? null;
}

/**
 * Todos los pronósticos para un match (con el user joineado).
 * Usado en /matches/[id] post-kickoff.
 */
export async function getAllPredictionsForMatch(matchId: string) {
  const rows = await db.query.predictions.findMany({
    where: eq(predictions.matchId, matchId),
    with: {
      user: {
        columns: { id: true, name: true, image: true },
      },
    },
  });
  return rows;
}
