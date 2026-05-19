import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { matches, type Team } from "@/db/schema";
import { getTeamsByGroup } from "./teams";

export type GroupStanding = {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

/**
 * Calcula las standings de los grupos a partir de matches finalizados.
 * Para grupos sin partidos jugados todavía, devuelve 0s.
 */
export async function getGroupStandings(): Promise<
  Record<string, GroupStanding[]>
> {
  // Traer todos los teams agrupados (siempre 4 por grupo, 12 grupos).
  const teamsByGroup = await getTeamsByGroup();

  // Traer matches finalizados con score.
  const finished = await db.query.matches.findMany({
    where: and(
      eq(matches.status, "finished"),
      isNotNull(matches.homeScore),
      isNotNull(matches.awayScore),
    ),
    columns: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      groupLetter: true,
    },
  });

  // Por cada team, calcular stats agregadas.
  const statsByTeamId = new Map<string, Omit<GroupStanding, "team">>();
  const init = () => ({
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  });

  for (const m of finished) {
    const home =
      statsByTeamId.get(m.homeTeamId) ?? init();
    const away =
      statsByTeamId.get(m.awayTeamId) ?? init();

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore!;
    home.goalsAgainst += m.awayScore!;
    away.goalsFor += m.awayScore!;
    away.goalsAgainst += m.homeScore!;

    if (m.homeScore! > m.awayScore!) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (m.homeScore! < m.awayScore!) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
      home.draws++;
      home.points += 1;
      away.draws++;
      away.points += 1;
    }

    statsByTeamId.set(m.homeTeamId, home);
    statsByTeamId.set(m.awayTeamId, away);
  }

  // Combinar con los teams y agrupar por letra.
  const result: Record<string, GroupStanding[]> = {};
  for (const [letter, teams] of Object.entries(teamsByGroup)) {
    result[letter] = teams
      .map((team) => ({
        team,
        ...(statsByTeamId.get(team.id) ?? init()),
      }))
      .sort((a, b) => {
        // Ordenar por: pts desc, diferencia de gol desc, goles a favor desc
        if (b.points !== a.points) return b.points - a.points;
        const aDiff = a.goalsFor - a.goalsAgainst;
        const bDiff = b.goalsFor - b.goalsAgainst;
        if (bDiff !== aDiff) return bDiff - aDiff;
        return b.goalsFor - a.goalsFor;
      });
  }
  return result;
}
