import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { bracketPicks, matches } from "@/db/schema";
import { BRACKET_POINTS_PER_HIT } from "@/lib/scoring";

/**
 * Recalcula los puntos del bracket de todos los usuarios.
 *
 * Scoring por-cruce: el pick del usuario para el match N suma
 * BRACKET_POINTS_PER_HIT si coincide con el ganador REAL de ese cruce. Si el
 * cruce aún no terminó (o quedó empate sin resolver), el pick queda en `null`
 * (sin calcular) hasta que se resuelva.
 *
 * Idempotente: sólo actualiza los picks cuyo puntaje cambió. Se llama desde el
 * sync cuando un KO pasa a `finished`.
 */
export async function resolveBracketScores(): Promise<{ updated: number }> {
  // Ganador real de cada cruce KO (excepto 3er puesto, que no entra al bracket).
  const koMatches = await db.query.matches.findMany({
    where: and(ne(matches.stage, "group"), ne(matches.stage, "third_place")),
    columns: {
      matchNum: true,
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });

  const winnerByMatch = new Map<number, string | null>();
  for (const m of koMatches) {
    if (m.matchNum == null) continue;
    const resolved =
      m.status === "finished" &&
      m.homeScore != null &&
      m.awayScore != null &&
      m.homeTeamId != null &&
      m.awayTeamId != null &&
      m.homeScore !== m.awayScore; // empate = penales sin reflejar → sin ganador
    winnerByMatch.set(
      m.matchNum,
      resolved ? (m.homeScore! > m.awayScore! ? m.homeTeamId! : m.awayTeamId!) : null,
    );
  }

  const picks = await db.query.bracketPicks.findMany({
    columns: { id: true, matchNum: true, winnerTeamId: true, points: true },
  });

  let updated = 0;
  for (const p of picks) {
    const winner = winnerByMatch.get(p.matchNum) ?? null;
    const newPoints =
      winner === null
        ? null
        : p.winnerTeamId === winner
          ? BRACKET_POINTS_PER_HIT
          : 0;
    if (newPoints !== p.points) {
      await db
        .update(bracketPicks)
        .set({ points: newPoints, updatedAt: new Date() })
        .where(eq(bracketPicks.id, p.id));
      updated++;
    }
  }

  return { updated };
}
