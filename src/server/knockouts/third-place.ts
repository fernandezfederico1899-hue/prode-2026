import "server-only";
import allocationTable from "@/data/third-place-allocation.json";
import type { GroupStanding } from "@/server/queries/standings";

// Mapa generado por scripts/build-third-place-allocation.mjs desde la tabla
// oficial FIFA (495 combinaciones). Clave = 8 letras de grupo ordenadas
// alfabéticamente (los grupos cuyo 3° clasifica); valor = { matchNum: grupo del 3° }.
const allocation = allocationTable as Record<string, Record<string, string>>;

// Los 8 partidos de 16avos que reciben un mejor-tercero.
export const THIRD_PLACE_MATCH_NUMS = [74, 77, 79, 80, 81, 82, 85, 87] as const;

export type ThirdPlaceResolution = {
  assignments: Record<number, string>; // matchNum → teamId del tercero
  qualifiedGroups: string[]; // letras de los 8 grupos clasificados, ordenadas
};

/**
 * Dado el ranking de terceros (de getBestThirdPlaceRanking, top 8 = clasificados),
 * resuelve qué tercero va a cada uno de los 8 slots de 16avos según la tabla
 * oficial FIFA. Cada GroupStanding del ranking ya es el 3° de su grupo, con
 * `team.id` (teamId del tercero) y `team.groupLetter`.
 *
 * Lanza si la fase de grupos no terminó (menos de 8 terceros) o si la combinación
 * no existe en la tabla (no debería pasar nunca con datos válidos).
 */
export function resolveThirdPlaceSlots(
  thirdRanking: GroupStanding[],
): ThirdPlaceResolution {
  const top8 = thirdRanking.slice(0, 8);
  if (top8.length < 8) {
    throw new Error("third_ranking_incomplete");
  }

  // teamId del 3° de cada grupo clasificado, indexado por letra de grupo.
  const thirdTeamIdByGroup = new Map<string, string>();
  for (const standing of top8) {
    const letter = standing.team.groupLetter;
    if (!letter) throw new Error(`third_without_group:${standing.team.id}`);
    thirdTeamIdByGroup.set(letter, standing.team.id);
  }

  const qualifiedGroups = [...thirdTeamIdByGroup.keys()].sort();
  if (qualifiedGroups.length !== 8) {
    throw new Error("third_groups_not_unique");
  }

  const key = qualifiedGroups.join("");
  const mapping = allocation[key];
  if (!mapping) {
    // standings garantiza que el grupo del tercero está completo, así que esto
    // sólo ocurriría con datos corruptos. El admin puede asignar a mano.
    throw new Error(`no_allocation_for:${key}`);
  }

  const assignments: Record<number, string> = {};
  for (const [matchNumStr, groupLetter] of Object.entries(mapping)) {
    const teamId = thirdTeamIdByGroup.get(groupLetter);
    if (!teamId) throw new Error(`allocation_group_not_qualified:${groupLetter}`);
    assignments[Number(matchNumStr)] = teamId;
  }

  return { assignments, qualifiedGroups };
}
