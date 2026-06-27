import "server-only";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { bracketPicks, matches, type Match, type Team } from "@/db/schema";

/**
 * Un nodo del cuadro de eliminatorias. Para 16avos (round_of_32) los equipos
 * ya vienen resueltos; para rondas siguientes los equipos se determinan por los
 * picks del usuario en los dos `*SourceMatchNum` (de qué cruce viene cada lado).
 */
export type BracketNode = {
  matchNum: number;
  stage: Match["stage"];
  kickoffAt: Date;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeSourceMatchNum: number | null;
  awaySourceMatchNum: number | null;
};

/**
 * Los 31 partidos que el usuario predice en su bracket: 16avos (16), octavos (8),
 * cuartos (4), semis (2) y final (1). El 3er puesto queda fuera del challenge.
 * Ordenados por matchNum (agrupa naturalmente por ronda: 73-88, 89-96, ...).
 */
export async function getKnockoutTree(): Promise<BracketNode[]> {
  const rows = await db.query.matches.findMany({
    where: and(ne(matches.stage, "group"), ne(matches.stage, "third_place")),
    columns: {
      matchNum: true,
      stage: true,
      kickoffAt: true,
      homeSourceMatchNum: true,
      awaySourceMatchNum: true,
    },
    with: { homeTeam: true, awayTeam: true },
    orderBy: asc(matches.matchNum),
  });

  return rows
    .filter((r) => r.matchNum != null)
    .map((r) => ({
      matchNum: r.matchNum as number,
      stage: r.stage,
      kickoffAt: r.kickoffAt,
      homeTeam: r.homeTeam,
      awayTeam: r.awayTeam,
      homeSourceMatchNum: r.homeSourceMatchNum,
      awaySourceMatchNum: r.awaySourceMatchNum,
    }));
}

/** Picks del bracket del usuario: { matchNum → winnerTeamId }. */
export async function getUserBracketPicks(
  userId: string,
): Promise<Record<number, string>> {
  const rows = await db.query.bracketPicks.findMany({
    where: eq(bracketPicks.userId, userId),
    columns: { matchNum: true, winnerTeamId: true },
  });
  const out: Record<number, string> = {};
  for (const r of rows) out[r.matchNum] = r.winnerTeamId;
  return out;
}
