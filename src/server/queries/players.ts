import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { players, teams, type Player, type Team } from "@/db/schema";

export type PlayerWithTeam = Player & { team: Team };

export async function getAllPlayersWithTeam(): Promise<PlayerWithTeam[]> {
  const rows = await db
    .select({
      id: players.id,
      apiSportsPlayerId: players.apiSportsPlayerId,
      name: players.name,
      teamId: players.teamId,
      position: players.position,
      team: teams,
    })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .orderBy(asc(players.name));
  return rows as PlayerWithTeam[];
}

// helper import (drizzle no auto-importa cuando uses select obj)
import { eq } from "drizzle-orm";
