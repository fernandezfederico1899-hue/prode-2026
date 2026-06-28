import "server-only";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";

/**
 * Cuando un partido KO termina, propaga el winner (o loser para 3er puesto)
 * al siguiente match en la cadena.
 *
 * Mecanismo: cada match KO tiene `home_source_match_num` / `away_source_match_num`
 * apuntando al partido del que sale su equipo, más un outcome 'W' o 'L'.
 * Buscamos los matches downstream cuyo source apunte al matchNum recién
 * finalizado y asignamos el team correspondiente.
 *
 * Idempotente: solo asigna si el slot estaba NULL.
 */
export async function propagateKnockoutResults(matchId: string): Promise<{
  propagated: number;
}> {
  const m = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    columns: {
      id: true,
      matchNum: true,
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeamId: true,
      awayTeamId: true,
      shootoutWinner: true,
    },
  });

  if (!m) return { propagated: 0 };
  if (m.status !== "finished") return { propagated: 0 };
  if (m.matchNum === null) return { propagated: 0 };
  if (m.homeScore === null || m.awayScore === null) return { propagated: 0 };
  if (!m.homeTeamId || !m.awayTeamId) return { propagated: 0 };

  // Determinar quién avanza. Si no hubo empate, gana el del marcador. Si terminó
  // empatado a 90/120, se define por penales: usamos shootoutWinner (lo setea el
  // sync desde la API). Si el empate todavía no tiene ganador, no propagamos.
  let winnerId: string;
  let loserId: string;
  if (m.homeScore === m.awayScore) {
    if (m.shootoutWinner === "home") {
      winnerId = m.homeTeamId;
      loserId = m.awayTeamId;
    } else if (m.shootoutWinner === "away") {
      winnerId = m.awayTeamId;
      loserId = m.homeTeamId;
    } else {
      return { propagated: 0 };
    }
  } else {
    winnerId = m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
    loserId = m.homeScore > m.awayScore ? m.awayTeamId : m.homeTeamId;
  }

  // Buscar matches downstream que dependan de este matchNum.
  const downstream = await db.query.matches.findMany({
    where: or(
      eq(matches.homeSourceMatchNum, m.matchNum),
      eq(matches.awaySourceMatchNum, m.matchNum),
    ),
  });

  let propagated = 0;
  for (const next of downstream) {
    const updates: Record<string, unknown> = {};

    if (
      next.homeSourceMatchNum === m.matchNum &&
      next.homeTeamId === null
    ) {
      updates.homeTeamId =
        next.homeSourceOutcome === "L" ? loserId : winnerId;
    }
    if (
      next.awaySourceMatchNum === m.matchNum &&
      next.awayTeamId === null
    ) {
      updates.awayTeamId =
        next.awaySourceOutcome === "L" ? loserId : winnerId;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(matches).set(updates).where(eq(matches.id, next.id));
      propagated += Object.keys(updates).filter((k) =>
        k.endsWith("TeamId"),
      ).length;
    }
  }

  return { propagated };
}
