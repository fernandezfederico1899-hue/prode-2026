import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tournamentConfig, type TournamentConfig } from "@/db/schema";

/**
 * Trae el singleton de tournament_config (id = 1). Lo cachea el caller si hace falta.
 */
export async function getTournamentConfig(): Promise<TournamentConfig | null> {
  const row = await db.query.tournamentConfig.findFirst({
    where: eq(tournamentConfig.id, 1),
  });
  return row ?? null;
}

/**
 * `true` si el torneo ya empezó (kickoff del primer partido pasó).
 */
export async function hasTournamentStarted(): Promise<boolean> {
  const cfg = await getTournamentConfig();
  if (!cfg) return false;
  return cfg.tournamentStartsAt.getTime() <= Date.now();
}
