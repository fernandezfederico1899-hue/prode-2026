import "server-only";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { apiSports, type ApiSportsFixture } from "@/server/integrations/api-sports";
import { recalculateForMatch } from "@/server/scoring/recalculate";
import { propagateKnockoutResults } from "@/server/scoring/propagate-knockouts";

// Estados API-Sports → nuestros estados internos.
const STATUS_MAP: Record<string, "scheduled" | "live" | "finished"> = {
  // En vivo
  "1H": "live",
  HT: "live",
  "2H": "live",
  ET: "live",
  P: "live",
  LIVE: "live",
  BT: "live", // break time
  // Finalizado
  FT: "finished",
  AET: "finished",
  PEN: "finished",
  // No empezó (no debería cambiar, pero por completitud)
  TBD: "scheduled",
  NS: "scheduled",
};

/**
 * Sync core: chequea si tenemos algún partido en ventana de juego (o que se
 * acaba de pasar a finished) y si es así, hace 1 llamada a /fixtures?live=all.
 * Si no hay ningún partido en ventana, ahorra la llamada.
 *
 * Estrategia: el cron corre cada 3 min vía Vercel.
 */
export async function syncLive(): Promise<{
  callsUsed: number;
  matchesUpdated: number;
  reason: string;
}> {
  // 1. ¿Estamos en pausa por 429 reciente?
  if (await apiSports.isPaused()) {
    return { callsUsed: 0, matchesUpdated: 0, reason: "rate_limit_pause" };
  }

  // 2. ¿Hay algún partido en ventana? (kickoff en últimas 4hs o próximas 30min)
  const now = Date.now();
  const windowStart = new Date(now - 4 * 60 * 60 * 1000); // -4hrs
  const windowEnd = new Date(now + 30 * 60 * 1000); // +30min

  const candidates = await db.query.matches.findMany({
    where: and(
      gte(matches.kickoffAt, windowStart),
      lte(matches.kickoffAt, windowEnd),
      or(eq(matches.status, "scheduled"), eq(matches.status, "live")),
    ),
    with: { homeTeam: true, awayTeam: true },
  });

  if (candidates.length === 0) {
    return { callsUsed: 0, matchesUpdated: 0, reason: "no_matches_in_window" };
  }

  // 3. 1 sola llamada para todos los partidos en vivo del mundo.
  const liveFixtures = await apiSports.fetchLiveFixtures();

  // 4. Match by team names (openfootballName). Solo si los teams ya están
  // resueltos (no es un placeholder KO sin asignar).
  let updated = 0;
  for (const c of candidates) {
    if (!c.homeTeam || !c.awayTeam) continue;
    const fixture = liveFixtures.find((f) =>
      teamMatch(f, c.homeTeam!.openfootballName, c.awayTeam!.openfootballName),
    );
    if (!fixture) continue;

    const newStatus = STATUS_MAP[fixture.fixture.status.short] ?? c.status;
    const homeScore = fixture.goals.home;
    const awayScore = fixture.goals.away;

    const changed =
      newStatus !== c.status ||
      homeScore !== c.homeScore ||
      awayScore !== c.awayScore;

    if (!changed) continue;

    await db
      .update(matches)
      .set({
        status: newStatus,
        homeScore,
        awayScore,
        apiSportsFixtureId: fixture.fixture.id,
        lastSyncedAt: new Date(),
        finishedAt: newStatus === "finished" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, c.id));

    // Si terminó, recalculamos puntos y propagamos KO si corresponde.
    if (newStatus === "finished") {
      await recalculateForMatch(c.id);
      await propagateKnockoutResults(c.id);
    }

    updated++;
  }

  return {
    callsUsed: 1,
    matchesUpdated: updated,
    reason: `${candidates.length} candidatos, ${liveFixtures.length} en vivo global, ${updated} actualizados`,
  };
}

/**
 * Compara nombres de teams entre API-Sports y nuestro openfootballName.
 * API-Sports usa nombres en inglés tipo "Argentina", "South Korea". Igual
 * que openfootball. Si no hay match exacto, intentamos variantes comunes.
 */
function teamMatch(
  fixture: ApiSportsFixture,
  ourHomeName: string,
  ourAwayName: string,
): boolean {
  const apiHome = norm(fixture.teams.home.name);
  const apiAway = norm(fixture.teams.away.name);
  const ourHome = norm(ourHomeName);
  const ourAway = norm(ourAwayName);
  return apiHome === ourHome && apiAway === ourAway;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/[^a-z0-9]/g, ""); // non-alphanumeric
}
