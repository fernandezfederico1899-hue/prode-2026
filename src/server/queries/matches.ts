import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import type { MatchWithTeams } from "@/lib/types";

export type { MatchWithTeams };

/**
 * Todos los partidos con sus teams (home + away) cargados. Filtra los KO
 * sin equipos asignados todavía (placeholders).
 */
export async function getAllMatchesWithTeams(): Promise<MatchWithTeams[]> {
  const rows = await db.query.matches.findMany({
    orderBy: [asc(matches.kickoffAt)],
    with: {
      homeTeam: true,
      awayTeam: true,
    },
  });
  return rows.filter(
    (r) => r.homeTeam !== null && r.awayTeam !== null,
  ) as unknown as MatchWithTeams[];
}

/**
 * Un partido específico por ID, con teams cargados.
 */
export async function getMatchByIdWithTeams(
  id: string,
): Promise<MatchWithTeams | null> {
  const row = await db.query.matches.findFirst({
    where: eq(matches.id, id),
    with: { homeTeam: true, awayTeam: true },
  });
  return (row ?? null) as unknown as MatchWithTeams | null;
}

/**
 * Partidos de un grupo específico (ej "A"), ordenados por kickoff.
 */
export async function getMatchesByGroupWithTeams(
  groupLetter: string,
): Promise<MatchWithTeams[]> {
  const rows = await db.query.matches.findMany({
    where: eq(matches.groupLetter, groupLetter),
    orderBy: [asc(matches.kickoffAt)],
    with: { homeTeam: true, awayTeam: true },
  });
  return rows as unknown as MatchWithTeams[];
}
