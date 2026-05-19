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
  position: number; // 1..4 dentro del grupo
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

  // Traer solo matches de grupo finalizados con score y teams resueltos.
  const finishedRaw = await db.query.matches.findMany({
    where: and(
      eq(matches.stage, "group"),
      eq(matches.status, "finished"),
      isNotNull(matches.homeScore),
      isNotNull(matches.awayScore),
      isNotNull(matches.homeTeamId),
      isNotNull(matches.awayTeamId),
    ),
    columns: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      groupLetter: true,
    },
  });
  // Cast a non-null después del filtro SQL (drizzle isNotNull no estrecha el tipo).
  const finished = finishedRaw as Array<{
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    groupLetter: string | null;
  }>;

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
    position: 0,
  });

  for (const m of finished) {
    const home = statsByTeamId.get(m.homeTeamId) ?? init();
    const away = statsByTeamId.get(m.awayTeamId) ?? init();

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (m.homeScore < m.awayScore) {
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

  // Combinar con los teams y agrupar por letra, resolviendo tiebreakers
  // FIFA: pts > GD > GF > head-to-head (pts/GD/GF entre empatados) > nombre.
  const result: Record<string, GroupStanding[]> = {};
  for (const [letter, teams] of Object.entries(teamsByGroup)) {
    const rows = teams.map((team) => ({
      team,
      ...(statsByTeamId.get(team.id) ?? init()),
      position: 0,
    }));
    const sorted = sortWithTiebreakers(rows, finished);
    result[letter] = sorted.map((s, i) => ({ ...s, position: i + 1 }));
  }
  return result;
}

function globalCmp(a: GroupStanding, b: GroupStanding): number {
  if (b.points !== a.points) return b.points - a.points;
  const aDiff = a.goalsFor - a.goalsAgainst;
  const bDiff = b.goalsFor - b.goalsAgainst;
  if (bDiff !== aDiff) return bDiff - aDiff;
  return b.goalsFor - a.goalsFor;
}

function sortWithTiebreakers(
  rows: GroupStanding[],
  finished: Array<{
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeScore: number | null;
    awayScore: number | null;
  }>,
): GroupStanding[] {
  const sorted = [...rows].sort(globalCmp);
  const result: GroupStanding[] = [];
  let i = 0;
  while (i < sorted.length) {
    const block: GroupStanding[] = [sorted[i]];
    let j = i + 1;
    while (j < sorted.length && globalCmp(sorted[i], sorted[j]) === 0) {
      block.push(sorted[j]);
      j++;
    }
    if (block.length === 1) {
      result.push(block[0]);
    } else {
      result.push(...resolveByHeadToHead(block, finished));
    }
    i = j;
  }
  return result;
}

function resolveByHeadToHead(
  tied: GroupStanding[],
  finished: Array<{
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeScore: number | null;
    awayScore: number | null;
  }>,
): GroupStanding[] {
  const ids = new Set(tied.map((t) => t.team.id));
  const h2h = new Map<string, { pts: number; gd: number; gf: number }>();
  for (const t of tied) h2h.set(t.team.id, { pts: 0, gd: 0, gf: 0 });

  for (const m of finished) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    if (m.homeScore === null || m.awayScore === null) continue;
    if (!ids.has(m.homeTeamId) || !ids.has(m.awayTeamId)) continue;
    const home = h2h.get(m.homeTeamId)!;
    const away = h2h.get(m.awayTeamId)!;
    home.gf += m.homeScore;
    home.gd += m.homeScore - m.awayScore;
    away.gf += m.awayScore;
    away.gd += m.awayScore - m.homeScore;
    if (m.homeScore > m.awayScore) home.pts += 3;
    else if (m.homeScore < m.awayScore) away.pts += 3;
    else {
      home.pts += 1;
      away.pts += 1;
    }
  }

  return [...tied].sort((a, b) => {
    const ah = h2h.get(a.team.id)!;
    const bh = h2h.get(b.team.id)!;
    if (bh.pts !== ah.pts) return bh.pts - ah.pts;
    if (bh.gd !== ah.gd) return bh.gd - ah.gd;
    if (bh.gf !== ah.gf) return bh.gf - ah.gf;
    return a.team.name.localeCompare(b.team.name);
  });
}

/**
 * Ranking global de los 12 equipos que terminaron 3ros en sus grupos,
 * ordenados por pts/GD/GF. Los primeros 8 clasifican como "mejores terceros".
 * Si todavía no terminó la fase de grupos, devuelve lista vacía.
 */
export async function getBestThirdPlaceRanking(): Promise<GroupStanding[]> {
  const all = await getGroupStandings();
  const thirds: GroupStanding[] = [];
  for (const list of Object.values(all)) {
    const third = list.find((s) => s.position === 3);
    if (third && third.played > 0) thirds.push(third);
  }
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name);
  });
  return thirds.map((t, i) => ({ ...t, position: i + 1 }));
}
