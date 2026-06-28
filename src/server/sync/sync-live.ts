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

// Tope diario de seguridad. football-data free limita por MINUTO (10/min), no
// por día, así que esto NO es un límite del proveedor sino un cortacircuitos
// ante un loop descontrolado. Con cron cada 10 min el uso real es ~50-100/día.
const DAILY_BUDGET = 400;

// Alias de equipos: nuestro openfootballName vs el nombre de football-data.
// La mayoría coincide; estos 4 no (clave: ambos normalizados con norm()).
const TEAM_ALIASES: Record<string, string> = {
  usa: "unitedstates",
  czechrepublic: "czechia",
  capeverde: "capeverdeislands",
  drcongo: "congodr",
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

  // 1.5. ¿Nos queda budget diario? Corte duro para no gatillar la suspensión.
  const usage = await apiSports.getUsageToday();
  if (usage.count >= DAILY_BUDGET) {
    return {
      callsUsed: 0,
      matchesUpdated: 0,
      reason: `daily_budget_reached (${usage.count}/${usage.limit})`,
    };
  }

  // 2. ¿Hay algún partido en ventana? Polleamos desde 15min antes del kickoff
  // (no 4hs: eso quemaba llamadas sin que el partido hubiera empezado) hasta
  // 2.5hs después (cubre el partido completo por si no lo agarramos en `live`).
  const now = Date.now();
  const windowStart = new Date(now - 150 * 60 * 1000); // -2.5hs
  const windowEnd = new Date(now + 15 * 60 * 1000); // +15min

  // Un match en "live" entra siempre como candidato (aunque haya salido de la
  // ventana): si quedó clavado en live necesitamos cerrarlo sí o sí.
  const candidates = await db.query.matches.findMany({
    where: or(
      and(
        gte(matches.kickoffAt, windowStart),
        lte(matches.kickoffAt, windowEnd),
        eq(matches.status, "scheduled"),
      ),
      eq(matches.status, "live"),
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
  let callsUsed = 1;
  const stuckLive: typeof candidates = [];

  for (const c of candidates) {
    if (!c.homeTeam || !c.awayTeam) continue;
    const fixture = liveFixtures.find((f) =>
      teamMatch(f, c.homeTeam!.openfootballName, c.awayTeam!.openfootballName),
    );
    if (!fixture) {
      // Estaba live y ya no aparece en live=all: probablemente terminó (los FT
      // salen de ese feed enseguida). Lo confirmamos por ID en el paso 5.
      if (c.status === "live") stuckLive.push(c);
      continue;
    }

    if (await applyFixture(c, fixture)) updated++;
  }

  // 5. Fallback para matches clavados en live: 1 llamada por ID para traer el
  // estado real (FT/AET/PEN). Sin esto, un match que termina entre dos ticks
  // del cron queda en "live" para siempre y nunca se recalculan los puntos.
  for (const c of stuckLive) {
    if (!c.apiSportsFixtureId) continue;
    const fixture = await apiSports.fetchFixtureById(c.apiSportsFixtureId);
    callsUsed++;
    if (!fixture) continue;

    if (await applyFixture(c, fixture)) updated++;
  }

  return {
    callsUsed,
    matchesUpdated: updated,
    reason: `${candidates.length} candidatos, ${liveFixtures.length} en vivo global, ${stuckLive.length} resueltos por ID, ${updated} actualizados`,
  };
}

/**
 * Aplica el estado/score de un fixture de API-Sports a nuestro match.
 * Devuelve true si hubo cambios. Si el match terminó, recalcula puntos y
 * propaga KO.
 */
async function applyFixture(
  c: {
    id: string;
    status: (typeof matches.status.enumValues)[number];
    homeScore: number | null;
    awayScore: number | null;
  },
  fixture: ApiSportsFixture,
): Promise<boolean> {
  const newStatus = STATUS_MAP[fixture.fixture.status.short] ?? c.status;
  const homeScore = fixture.goals.home;
  const awayScore = fixture.goals.away;

  // Ganador por penales: sólo cuando el partido termina empatado a 90/120 pero
  // la API marca un ganador (definición por penales). El marcador a 90 (empate)
  // sigue contando para los puntos; esto sólo decide quién avanza en el cuadro.
  const shootoutWinner =
    newStatus === "finished" &&
    homeScore !== null &&
    awayScore !== null &&
    homeScore === awayScore &&
    (fixture.result.winner === "HOME_TEAM" ||
      fixture.result.winner === "AWAY_TEAM")
      ? fixture.result.winner === "HOME_TEAM"
        ? "home"
        : "away"
      : null;

  const changed =
    newStatus !== c.status ||
    homeScore !== c.homeScore ||
    awayScore !== c.awayScore;

  if (!changed) return false;

  await db
    .update(matches)
    .set({
      status: newStatus,
      homeScore,
      awayScore,
      shootoutWinner,
      apiSportsFixtureId: fixture.fixture.id,
      lastSyncedAt: new Date(),
      finishedAt: newStatus === "finished" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, c.id));

  // Si terminó, recalculamos puntos y propagamos KO (arma la ronda siguiente).
  if (newStatus === "finished") {
    await recalculateForMatch(c.id);
    await propagateKnockoutResults(c.id);
  }

  return true;
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
  const ourHome = alias(norm(ourHomeName));
  const ourAway = alias(norm(ourAwayName));
  return apiHome === ourHome && apiAway === ourAway;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/[^a-z0-9]/g, ""); // non-alphanumeric
}

// Traduce el nombre normalizado de nuestra DB al de football-data si difiere.
function alias(normalized: string): string {
  return TEAM_ALIASES[normalized] ?? normalized;
}
