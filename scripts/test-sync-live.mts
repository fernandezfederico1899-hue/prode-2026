/**
 * Tests de `syncLive` de punta a punta: el early return, el gatillo por cuadro
 * incompleto, la reconciliación contra la API y el repairBracket final (paso 7),
 * que es la única ruta por la que el sync propaga el cuadro.
 *
 * Mockea `fetch`, no el módulo de la API: el feed falso entra por el mismo
 * camino que el real (adaptMatch, minusPenalties, STATUS_MAP), así que también
 * cubre que los penales no inflen el marcador.
 *
 * Los casos 2 y 5 son los que aíslan el paso 7: neutralizarlo los hace fallar.
 *
 * Uso: pnpm test:sync   (necesita la base desechable — ver scripts/test-bracket.mts)
 */
import postgres from "postgres";
import { check, finish, Fixture, prepareTestEnv } from "./test-support.mjs";

const TEST_URL = prepareTestEnv();

const { syncLive } = await import("@/server/sync/sync-live");

const sql = postgres(TEST_URL, { prepare: false });
const fx = new Fixture(sql, ["Switzerland", "Colombia", "Argentina", "Egypt"]);

// --- Feed falso de football-data ---------------------------------------------

type FdScore = {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: string;
  fullTime: { home: number | null; away: number | null };
  penalties?: { home: number; away: number } | null;
};

type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: FdScore;
};

let feed: FdMatch[] = [];
let fetchCalls = 0;

globalThis.fetch = (async () => {
  fetchCalls++;
  return new Response(JSON.stringify({ matches: feed }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}) as unknown as typeof fetch;

function fdMatch(
  id: number,
  home: string,
  away: string,
  status: string,
  score: FdScore,
): FdMatch {
  return {
    id,
    utcDate: new Date().toISOString(),
    status,
    homeTeam: { id: id * 10, name: home },
    awayTeam: { id: id * 10 + 1, name: away },
    score,
  };
}

async function seedConfig() {
  await sql`DELETE FROM tournament_config`;
  await sql`
    INSERT INTO tournament_config (id, tournament_starts_at, api_sports_daily_count, api_sports_count_date)
    VALUES (1, now(), 0, current_date)`;
}

async function matchRow(num: number) {
  const [r] = await sql`
    SELECT status, home_score, away_score, shootout_winner
    FROM matches WHERE match_num=${num}`;
  return r;
}

// -----------------------------------------------------------------------------
// Caso 1: cuadro sano, ningún partido en ventana -> ni una llamada a la API.
// -----------------------------------------------------------------------------
console.log("\nCaso 1: cuadro sano, sin partidos en ventana");
await seedConfig();
await fx.reset();
await fx.insert({ num: 95, stage: "round_of_16", status: "finished", home: "Argentina", away: "Egypt", hs: 3, as: 2, fixtureId: 1095, kickoffInHours: -48 });
await fx.insert({ num: 100, stage: "quarter", status: "scheduled", home: "Argentina", hSrc: 95, hOut: "W" });
fetchCalls = 0;
let r = await syncLive();
check("no llama a la API", fetchCalls, 0);
check("reason = no_matches_in_window", r.reason, "no_matches_in_window");
check("callsUsed = 0", r.callsUsed, 0);

// -----------------------------------------------------------------------------
// Caso 2: el bug real. Empate sin ganador por penales y ningún partido en
// ventana: el early return viejo cortaba acá y el cuadro quedaba roto.
// -----------------------------------------------------------------------------
console.log("\nCaso 2: penales pendientes, sin partidos en ventana (bug #96)");
await seedConfig();
await fx.reset();
await fx.insert({ num: 96, stage: "round_of_16", status: "finished", home: "Switzerland", away: "Colombia", hs: 0, as: 0, fixtureId: 1096, kickoffInHours: -48 });
await fx.insert({ num: 100, stage: "quarter", status: "scheduled", aSrc: 96, aOut: "W" });
// El feed ya publicó los penales: fullTime incluye el shootout (4-3).
feed = [
  fdMatch(1096, "Switzerland", "Colombia", "FINISHED", {
    winner: "HOME_TEAM",
    duration: "PENALTY_SHOOTOUT",
    fullTime: { home: 4, away: 3 },
    penalties: { home: 4, away: 3 },
  }),
];
fetchCalls = 0;
r = await syncLive();
check("sí llama a la API pese a no haber candidatos", fetchCalls, 1);
check("callsUsed = 1", r.callsUsed, 1);
const m96 = await matchRow(96);
check("shootout_winner = home", m96.shootout_winner, "home");
check("el marcador NO cuenta los penales", [m96.home_score, m96.away_score], [0, 0]);
check("#100.away = Switzerland", await fx.slotOf(100, "away"), "Switzerland");

// -----------------------------------------------------------------------------
// Caso 3: una vez sano, vuelve a ahorrar llamadas.
// -----------------------------------------------------------------------------
console.log("\nCaso 3: idempotencia tras reparar");
fetchCalls = 0;
r = await syncLive();
check("no llama a la API", fetchCalls, 0);
check("reason = no_matches_in_window", r.reason, "no_matches_in_window");

// -----------------------------------------------------------------------------
// Caso 4: invariante. Un partido finished cuyo fixture coincide con el feed
// (nada que escribir) y con el slot downstream vacío: el sync termina con el
// cuadro consistente igual. Metemos un partido en ventana para recorrer el sync
// entero en vez de salir por el early return.
//
// A diferencia de los casos 2 y 5, este NO aísla el paso 7: acá el slot ya lo
// llena el repairBracket del paso 2.5, antes de la reconciliación.
// -----------------------------------------------------------------------------
console.log("\nCaso 4: invariante — el sync termina con el cuadro consistente");
await seedConfig();
await fx.reset();
await fx.insert({ num: 95, stage: "round_of_16", status: "finished", home: "Argentina", away: "Egypt", hs: 3, as: 2, fixtureId: 1095, kickoffInHours: -48 });
await fx.insert({ num: 100, stage: "quarter", status: "scheduled", hSrc: 95, hOut: "W" });
// Un partido en ventana (empieza en 5 min) obliga a recorrer el sync completo.
await fx.insert({ num: 97, stage: "quarter", status: "scheduled", home: "Colombia", away: "Switzerland", fixtureId: 1097, kickoffInHours: 0.08 });
feed = [
  // Idéntico a lo que ya tenemos en la DB -> applyFixture no escribe ni propaga.
  fdMatch(1095, "Argentina", "Egypt", "FINISHED", {
    winner: "HOME_TEAM",
    duration: "REGULAR",
    fullTime: { home: 3, away: 2 },
  }),
  fdMatch(1097, "Colombia", "Switzerland", "TIMED", {
    winner: null,
    duration: "REGULAR",
    fullTime: { home: null, away: null },
  }),
];
fetchCalls = 0;
r = await syncLive();
check("recorre el sync completo (1 llamada)", fetchCalls, 1);
check("#100.home = Argentina", await fx.slotOf(100, "home"), "Argentina");
check("#95 sigue 3-2 finished", [(await matchRow(95)).status, (await matchRow(95)).home_score], ["finished", 3]);

// -----------------------------------------------------------------------------
// Caso 5: el feed corrige un resultado y cambia el ganador. El cuadro tiene que
// seguir el cambio mientras el partido de destino no se haya jugado.
// -----------------------------------------------------------------------------
console.log("\nCaso 5: la API corrige el ganador -> el cuadro lo sigue");
await seedConfig();
await fx.reset();
await fx.insert({ num: 95, stage: "round_of_16", status: "finished", home: "Argentina", away: "Egypt", hs: 3, as: 2, fixtureId: 1095, kickoffInHours: -48 });
await fx.insert({ num: 100, stage: "quarter", status: "scheduled", home: "Argentina", hSrc: 95, hOut: "W" });
await fx.insert({ num: 97, stage: "quarter", status: "scheduled", home: "Colombia", away: "Switzerland", fixtureId: 1097, kickoffInHours: 0.08 });
feed = [
  // Reemitido: en realidad ganó Egypt.
  fdMatch(1095, "Argentina", "Egypt", "FINISHED", {
    winner: "AWAY_TEAM",
    duration: "REGULAR",
    fullTime: { home: 2, away: 3 },
  }),
  fdMatch(1097, "Colombia", "Switzerland", "TIMED", {
    winner: null,
    duration: "REGULAR",
    fullTime: { home: null, away: null },
  }),
];
fetchCalls = 0;
r = await syncLive();
const m95 = await matchRow(95);
check("#95 pasa a 2-3", [m95.home_score, m95.away_score], [2, 3]);
check("#100.home pasa a Egypt", await fx.slotOf(100, "home"), "Egypt");

// -----------------------------------------------------------------------------
// Caso 6: sin dato de penales, no inventa un ganador y deja el slot vacío.
// -----------------------------------------------------------------------------
console.log("\nCaso 6: empate que el feed todavía no define");
await seedConfig();
await fx.reset();
await fx.insert({ num: 96, stage: "round_of_16", status: "finished", home: "Switzerland", away: "Colombia", hs: 0, as: 0, fixtureId: 1096, kickoffInHours: -48 });
await fx.insert({ num: 100, stage: "quarter", status: "scheduled", aSrc: 96, aOut: "W" });
feed = [
  fdMatch(1096, "Switzerland", "Colombia", "FINISHED", {
    winner: "DRAW",
    duration: "REGULAR",
    fullTime: { home: 0, away: 0 },
  }),
];
fetchCalls = 0;
r = await syncLive();
check("consulta la API (el cuadro está incompleto)", fetchCalls, 1);
check("#100.away sigue vacío", await fx.slotOf(100, "away"), null);
check("shootout_winner sigue null", (await matchRow(96)).shootout_winner, null);

finish(sql);
