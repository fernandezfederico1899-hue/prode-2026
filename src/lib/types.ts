// Re-exports canónicos del dominio para que el código no dependa directo de
// drizzle/schema.
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

/**
 * Match para el fixture: los teams pueden ser null en los KO sin definir
 * (se muestran con homeSlot/awaySlot).
 */
export type MatchForFixture = DbMatch & {
  homeTeam: DbTeam | null;
  awayTeam: DbTeam | null;
};

export type MatchStage = DbMatch["stage"];
export type MatchStatus = DbMatch["status"];
