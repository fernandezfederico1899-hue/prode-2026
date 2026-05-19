import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { teams, type Team } from "@/db/schema";

/**
 * Trae todos los equipos del torneo ordenados por (group, name).
 */
export async function getAllTeams(): Promise<Team[]> {
  return db.query.teams.findMany({
    orderBy: [asc(teams.groupLetter), asc(teams.name)],
  });
}

/**
 * Equipos agrupados por letra de grupo (Map A → [4 teams], B → ...).
 */
export async function getTeamsByGroup(): Promise<Record<string, Team[]>> {
  const all = await getAllTeams();
  const out: Record<string, Team[]> = {};
  for (const t of all) {
    if (!t.groupLetter) continue;
    (out[t.groupLetter] ??= []).push(t);
  }
  return out;
}
