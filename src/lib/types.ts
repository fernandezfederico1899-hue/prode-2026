/**
 * Tipos canónicos del dominio. Tanto los queries de DB como los mocks viejos
 * (que en M1.3 vamos desmontando) producen valores con esta forma.
 *
 * En el futuro mock-data.ts desaparece y todo viene de queries.
 */
import type {
  Match as DbMatch,
  Player as DbPlayer,
  Prediction as DbPrediction,
  Team as DbTeam,
} from "@/db/schema";

export type Team = DbTeam;
export type Player = DbPlayer;
export type Prediction = DbPrediction;
export type Match = DbMatch;

/**
 * Match con sus dos teams cargados (home + away). Lo que devuelven las queries
 * con `.with({ homeTeam, awayTeam })`.
 */
export type MatchWithTeams = DbMatch & {
  homeTeam: DbTeam;
  awayTeam: DbTeam;
};

export type MatchStage = DbMatch["stage"];
export type MatchStatus = DbMatch["status"];
