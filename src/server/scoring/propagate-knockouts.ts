import "server-only";
import { eq, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";

type KoMatch = typeof matches.$inferSelect;

/**
 * Quién avanza y quién queda eliminado. `null` si todavía no se puede saber:
 * el partido no terminó, o terminó empatado y no sabemos el ganador por penales
 * (el feed free lo publica tarde). Nunca adivinamos.
 */
function resolveOutcome(
  m: Pick<
    KoMatch,
    | "status"
    | "homeScore"
    | "awayScore"
    | "homeTeamId"
    | "awayTeamId"
    | "shootoutWinner"
  >,
): { winnerId: string; loserId: string } | null {
  if (m.status !== "finished") return null;
  if (m.homeScore === null || m.awayScore === null) return null;
  if (!m.homeTeamId || !m.awayTeamId) return null;

  if (m.homeScore === m.awayScore) {
    if (m.shootoutWinner === "home")
      return { winnerId: m.homeTeamId, loserId: m.awayTeamId };
    if (m.shootoutWinner === "away")
      return { winnerId: m.awayTeamId, loserId: m.homeTeamId };
    return null;
  }

  return m.homeScore > m.awayScore
    ? { winnerId: m.homeTeamId, loserId: m.awayTeamId }
    : { winnerId: m.awayTeamId, loserId: m.homeTeamId };
}

/** El 3er puesto se llena con los perdedores ('L'); el resto, con los ganadores. */
function teamForSlot(
  outcome: { winnerId: string; loserId: string },
  slotOutcome: string | null,
): string {
  return slotOutcome === "L" ? outcome.loserId : outcome.winnerId;
}

/**
 * Cuando un partido KO termina, propaga el winner (o loser para 3er puesto)
 * al siguiente match en la cadena.
 *
 * Mecanismo: cada match KO tiene `home_source_match_num` / `away_source_match_num`
 * apuntando al partido del que sale su equipo, más un outcome 'W' o 'L'.
 * Buscamos los matches downstream cuyo source apunte al matchNum recién
 * finalizado y asignamos el team correspondiente.
 *
 * Idempotente. Además de llenar slots vacíos corrige los que quedaron con un
 * equipo obsoleto (un score corregido a mano, o un ganador por penales que
 * revierte el resultado): reescribe el slot siempre que el partido downstream
 * todavía no haya empezado. Si ya se jugó no lo toca — el cuadro real mandó —
 * y lo reporta para que alguien lo mire.
 */
export async function propagateKnockoutResults(matchId: string): Promise<{
  propagated: number;
  corrected: number;
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

  if (!m || m.matchNum === null) return { propagated: 0, corrected: 0 };

  const outcome = resolveOutcome(m);
  if (!outcome) return { propagated: 0, corrected: 0 };

  // Buscar matches downstream que dependan de este matchNum.
  const downstream = await db.query.matches.findMany({
    where: or(
      eq(matches.homeSourceMatchNum, m.matchNum),
      eq(matches.awaySourceMatchNum, m.matchNum),
    ),
  });

  let propagated = 0;
  let corrected = 0;

  for (const next of downstream) {
    const updates: Partial<typeof matches.$inferInsert> = {};

    for (const side of ["home", "away"] as const) {
      const sourceNum =
        side === "home" ? next.homeSourceMatchNum : next.awaySourceMatchNum;
      if (sourceNum !== m.matchNum) continue;

      const current = side === "home" ? next.homeTeamId : next.awayTeamId;
      const slotOutcome =
        side === "home" ? next.homeSourceOutcome : next.awaySourceOutcome;
      const want = teamForSlot(outcome, slotOutcome);

      if (current === want) continue;

      if (current === null) {
        updates[side === "home" ? "homeTeamId" : "awayTeamId"] = want;
        propagated++;
      } else if (next.status === "scheduled") {
        updates[side === "home" ? "homeTeamId" : "awayTeamId"] = want;
        corrected++;
      } else {
        console.error(
          `[propagate] #${next.matchNum} ya está ${next.status} con un equipo obsoleto en ${side} ` +
            `(tiene ${current}, corresponde ${want} según #${m.matchNum}). No se toca: revisar a mano.`,
        );
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(matches).set(updates).where(eq(matches.id, next.id));
    }
  }

  return { propagated, corrected };
}

/**
 * Recorre el cuadro y clasifica cada slot KO contra el resultado de su origen.
 *
 * - `sourceIds`: orígenes ya terminados cuyo slot downstream está vacío o quedó
 *   con un equipo obsoleto, y que se pueden reparar acá mismo (0 llamadas).
 * - `unresolved`: slots vacíos cuyo origen terminó empatado y todavía no tiene
 *   ganador por penales. Solo la API puede destrabarlos.
 */
function collectRepairTargets(ko: KoMatch[]): {
  sourceIds: string[];
  unresolved: number;
} {
  const byNum = new Map<number, KoMatch>();
  for (const m of ko) if (m.matchNum !== null) byNum.set(m.matchNum, m);

  const sourceIds = new Set<string>();
  let unresolved = 0;

  for (const m of ko) {
    for (const side of ["home", "away"] as const) {
      const sourceNum =
        side === "home" ? m.homeSourceMatchNum : m.awaySourceMatchNum;
      if (sourceNum === null) continue;

      // Un slot vacío cuyo origen todavía no se jugó es lo normal, no un problema.
      const src = byNum.get(sourceNum);
      if (!src || src.status !== "finished") continue;

      const current = side === "home" ? m.homeTeamId : m.awayTeamId;
      const outcome = resolveOutcome(src);

      if (!outcome) {
        // Empate sin ganador por penales: nos falta el dato, no la propagación.
        if (current === null) unresolved++;
        continue;
      }

      const slotOutcome =
        side === "home" ? m.homeSourceOutcome : m.awaySourceOutcome;
      const want = teamForSlot(outcome, slotOutcome);

      if (current === null) sourceIds.add(src.id);
      else if (current !== want && m.status === "scheduled")
        sourceIds.add(src.id);
    }
  }

  return { sourceIds: [...sourceIds], unresolved };
}

async function loadKnockouts(): Promise<KoMatch[]> {
  return db.query.matches.findMany({ where: ne(matches.stage, "group") });
}

/**
 * Repara el cuadro con lo que ya tenemos en la DB, sin llamar a la API.
 * Idempotente y barato: con el cuadro sano es una sola query.
 *
 * Es la garantía de que el cuadro queda consistente aunque nadie haya llamado a
 * `propagateKnockoutResults` en el momento justo. El `unresolved` que devuelve
 * le dice al sync si vale la pena reconciliar contra la API aunque no haya
 * ningún partido en ventana.
 */
export async function repairBracket(): Promise<{
  propagated: number;
  corrected: number;
  unresolved: number;
}> {
  const { sourceIds, unresolved } = collectRepairTargets(await loadKnockouts());
  if (sourceIds.length === 0) return { propagated: 0, corrected: 0, unresolved };

  let propagated = 0;
  let corrected = 0;
  for (const id of sourceIds) {
    const r = await propagateKnockoutResults(id);
    propagated += r.propagated;
    corrected += r.corrected;
  }

  // Recontar: propagar pudo haber destrabado slots, pero los empates sin penales
  // siguen ahí.
  const after = collectRepairTargets(await loadKnockouts());
  return { propagated, corrected, unresolved: after.unresolved };
}
