import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players, teams, type Player, type Team } from "@/db/schema";

export type PlayerWithTeam = Player & { team: Team };

export async function getAllPlayersWithTeam(): Promise<PlayerWithTeam[]> {
  const rows = await db
    .select()
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .orderBy(asc(players.name));
  return rows.map((r) => ({ ...r.players, team: r.teams }));
}
