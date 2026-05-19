import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, type Match } from "@/db/schema";

export type MatchWithTeams = Match & {
  homeTeam: NonNullable<Awaited<ReturnType<typeof db.query.teams.findFirst>>>;
  awayTeam: NonNullable<Awaited<ReturnType<typeof db.query.teams.findFirst>>>;
};

/**
 * Todos los partidos con sus teams (home + away) cargados.
 */
export async function getAllMatchesWithTeams(): Promise<MatchWithTeams[]> {
  const rows = await db.query.matches.findMany({
    orderBy: [asc(matches.kickoffAt)],
    with: {
      homeTeam: true,
      awayTeam: true,
    },
  });
  // El infer de Drizzle no expone `with` automáticamente, así que casteamos.
  return rows as unknown as MatchWithTeams[];
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
