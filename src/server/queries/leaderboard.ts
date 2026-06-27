import "server-only";
import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { predictions, specialPredictions, users } from "@/db/schema";

export type LeaderboardEntry = {
  userId: string;
  name: string;
  image: string | null;
  matchPoints: number;
  bonusPoints: number;
  bracketPoints: number;
  totalPoints: number;
  exactCount: number;
  signCount: number;
  wrongCount: number;
  rank: number;
  isTied: boolean;
};

/**
 * Tabla de posiciones agregando puntos de TODOS los pronósticos finalizados
 * (predictions.points NOT NULL). Solo users aprobados.
 *
 * Desempate:
 * 1. Puntos totales (desc)
 * 2. Exactos (desc)
 * 3. Signos (desc)
 * 4. Si persiste empate: posición compartida (isTied=true).
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      image: users.image,
      matchPoints: sql<number>`coalesce(sum(${predictions.points}), 0)::int`,
      bonusPoints: sql<number>`coalesce(max(${specialPredictions.bonusPoints}), 0)::int`,
      // Subquery escalar correlacionado: evita inflar los sumatorios de arriba
      // con el producto cartesiano de las (hasta 31) filas de bracket_picks.
      bracketPoints: sql<number>`coalesce((select sum(bp.points) from bracket_picks bp where bp.user_id = ${users.id}), 0)::int`,
      exactCount: sql<number>`count(*) filter (where ${predictions.points} = 3)::int`,
      signCount: sql<number>`count(*) filter (where ${predictions.points} = 1)::int`,
      wrongCount: sql<number>`count(*) filter (where ${predictions.points} = 0)::int`,
    })
    .from(users)
    .leftJoin(predictions, eq(predictions.userId, users.id))
    .leftJoin(
      specialPredictions,
      eq(specialPredictions.userId, users.id),
    )
    .where(eq(users.status, "approved"))
    .groupBy(users.id, users.name, users.image);

  // Calcular total y ordenar.
  const withTotal = rows.map((r) => ({
    ...r,
    totalPoints: r.matchPoints + r.bonusPoints + r.bracketPoints,
  }));
  withTotal.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
    return b.signCount - a.signCount;
  });

  // Calcular ranks con empates compartidos.
  let rank = 0;
  let lastSig: string | null = null;
  const withRank: LeaderboardEntry[] = withTotal.map((r, i) => {
    const sig = `${r.totalPoints}-${r.exactCount}-${r.signCount}`;
    if (sig !== lastSig) {
      rank = i + 1;
    }
    lastSig = sig;
    return {
      userId: r.userId,
      name: r.name,
      image: r.image,
      matchPoints: r.matchPoints,
      bonusPoints: r.bonusPoints,
      bracketPoints: r.bracketPoints,
      totalPoints: r.totalPoints,
      exactCount: r.exactCount,
      signCount: r.signCount,
      wrongCount: r.wrongCount,
      rank,
      isTied: false,
    };
  });

  // Pasada 2: marcar tied a quienes comparten rank con otro
  const rankCounts = new Map<number, number>();
  for (const e of withRank) {
    rankCounts.set(e.rank, (rankCounts.get(e.rank) ?? 0) + 1);
  }
  for (const e of withRank) {
    if ((rankCounts.get(e.rank) ?? 0) > 1) e.isTied = true;
  }

  return withRank;
}
