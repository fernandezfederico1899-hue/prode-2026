import "server-only";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditLog, matches, predictions } from "@/db/schema";
import { calculateMatchPoints } from "@/lib/scoring";

/**
 * Chequeo de consistencia de puntos: verifica que el `points` persistido de
 * cada pronóstico coincida con recalcular la predicción contra el score ACTUAL
 * del match. Detecta (y opcionalmente corrige) el drift que aparece cuando un
 * match ya `finished` cambia de score después —corrección tardía de la API,
 * ajuste manual del admin, o un score provisional al cerrarse el partido— y
 * `recalculateForMatch` no volvió a correr para ese match (el sync no re-mira
 * matches finished, y las server actions solo recalculan el match que tocan).
 *
 * Es barato (2 queries + N updates solo si hay drift) y NO consume API-Sports,
 * así que puede correr en cada tick del cron.
 */

export type ReconcileMismatch = {
  matchId: string;
  matchLabel: string;
  predictionId: string;
  userId: string;
  was: number | null;
  now: number;
};

export type ReconcileReport = {
  checkedMatches: number;
  checkedPredictions: number;
  mismatches: ReconcileMismatch[];
  fixed: number;
};

export async function reconcilePoints(
  opts: { apply?: boolean } = {},
): Promise<ReconcileReport> {
  const apply = opts.apply ?? true;

  const finished = await db.query.matches.findMany({
    where: and(
      eq(matches.status, "finished"),
      isNotNull(matches.homeScore),
      isNotNull(matches.awayScore),
    ),
    columns: {
      id: true,
      homeScore: true,
      awayScore: true,
      matchNum: true,
      stage: true,
    },
  });
  if (finished.length === 0) {
    return { checkedMatches: 0, checkedPredictions: 0, mismatches: [], fixed: 0 };
  }

  const byId = new Map(finished.map((m) => [m.id, m]));
  const preds = await db.query.predictions.findMany({
    where: inArray(predictions.matchId, [...byId.keys()]),
    columns: {
      id: true,
      matchId: true,
      userId: true,
      homeScore: true,
      awayScore: true,
      points: true,
    },
  });

  const mismatches: ReconcileMismatch[] = [];
  for (const p of preds) {
    const m = byId.get(p.matchId)!;
    // Sabemos que homeScore/awayScore no son null por el filtro isNotNull.
    const expected = calculateMatchPoints(
      { homeScore: p.homeScore, awayScore: p.awayScore },
      { homeScore: m.homeScore!, awayScore: m.awayScore! },
    );
    if (expected !== p.points) {
      mismatches.push({
        matchId: p.matchId,
        matchLabel: `${m.stage}${m.matchNum ? ` #${m.matchNum}` : ""}`,
        predictionId: p.id,
        userId: p.userId,
        was: p.points,
        now: expected,
      });
    }
  }

  let fixed = 0;
  if (apply && mismatches.length > 0) {
    for (const mm of mismatches) {
      await db
        .update(predictions)
        .set({ points: mm.now, updatedAt: new Date() })
        .where(eq(predictions.id, mm.predictionId));
      fixed++;
    }
    // Rastro auditable de la auto-corrección.
    await db.insert(adminAuditLog).values({
      adminEmail: "system:reconcile",
      action: "reconcile_points",
      targetType: "predictions",
      targetId: "batch",
      payloadAfter: { fixed, mismatches } as never,
    });
  }

  return {
    checkedMatches: finished.length,
    checkedPredictions: preds.length,
    mismatches,
    fixed,
  };
}
