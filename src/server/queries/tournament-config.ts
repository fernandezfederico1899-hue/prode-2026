import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, tournamentConfig, type TournamentConfig } from "@/db/schema";

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

/**
 * `true` si el prode está cerrado: la final se jugó Y los bonus especiales ya
 * se resolvieron. Los bonus mueven la tabla final, así que mientras el admin no
 * los resuelva todavía no hay un campeón definitivo que anunciar.
 */
export async function hasTournamentEnded(): Promise<boolean> {
  const [cfg, final] = await Promise.all([
    getTournamentConfig(),
    db.query.matches.findFirst({
      where: eq(matches.stage, "final"),
      columns: { status: true },
    }),
  ]);
  return final?.status === "finished" && cfg?.bonusResolvedAt != null;
}
