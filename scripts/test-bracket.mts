/**
 * Tests de la propagación del cuadro de eliminatorias (`propagate-knockouts.ts`).
 *
 * Corre contra un Postgres DESECHABLE: crea y borra tablas enteras. Nunca lo
 * apuntes a una base con datos que te importen — hay una guarda que solo acepta
 * localhost, pero la guarda no sabe si ese localhost es tu base de desarrollo.
 *
 * Uso:
 *   pnpm test:bracket
 *
 * Requiere una base vacía corriendo. Con PostgreSQL instalado (Windows tiene
 * los binarios en "C:\Program Files\PostgreSQL\<ver>\bin"):
 *
 *   initdb -D /tmp/pgdata -U postgres --auth=trust
 *   pg_ctl -D /tmp/pgdata -o "-p 55432" -l /tmp/pg.log start
 *   createdb -h localhost -p 55432 -U postgres prode_test
 *   TEST_DATABASE_URL="postgresql://postgres@localhost:55432/prode_test" \
 *     DIRECT_URL="$TEST_DATABASE_URL" DATABASE_URL="$TEST_DATABASE_URL" \
 *     npx drizzle-kit push --force
 *   pnpm test:bracket
 *
 * OJO con `drizzle-kit push`: `drizzle.config.ts` resuelve `DIRECT_URL ?? DATABASE_URL`
 * y carga `.env.local`, así que si no exportás DIRECT_URL el push va a PRODUCCIÓN.
 *
 * `.mts` (no `.ts`) porque tsx compila los `.ts` de este repo a CJS y el
 * top-level await no existe ahí. El `--tsconfig tsconfig.test.json` del npm
 * script mapea `server-only` a un stub: fuera de Next ese paquete tira error.
 */
import postgres from "postgres";

const TEST_URL = process.env.TEST_DATABASE_URL;

if (!TEST_URL) {
  console.error(
    "TEST_DATABASE_URL no está seteada. Este test BORRA TABLAS: apuntalo a una base desechable.\n" +
      "Ver las instrucciones al principio de scripts/test-bracket.mts",
  );
  process.exit(1);
}

// Guarda: este test hace DELETE FROM matches. Correrlo con la DATABASE_URL de
// prod (p.ej. via --env-file=.env.local) vaciaría el torneo entero.
const host = new URL(TEST_URL).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error(
    `TEST_DATABASE_URL apunta a "${host}", no a localhost. Abortado: este test borra tablas.`,
  );
  process.exit(1);
}

// El módulo `@/db` lee env.DATABASE_URL al importarse, así que la reescribimos
// antes del import dinámico. Lo demás son placeholders para el validador de env.
process.env.DATABASE_URL = TEST_URL;
process.env.DIRECT_URL = TEST_URL;
// Sin esto `db` cae en NODE_ENV=development y loguea cada query. Via Object.assign
// porque los tipos de Node declaran NODE_ENV como readonly.
Object.assign(process.env, { NODE_ENV: "test" });
process.env.AUTH_SECRET ??= "test".repeat(8);
process.env.NEXTAUTH_URL ??= "http://localhost:3000";
process.env.FOOTBALL_DATA_TOKEN ??= "test-token";
process.env.ADMIN_EMAIL ??= "test@example.com";

const { propagateKnockoutResults, repairBracket } = await import(
  "@/server/scoring/propagate-knockouts"
);

const sql = postgres(TEST_URL, { prepare: false });

let failed = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  PASS  ${name}`);
  } else {
    console.log(`  FAIL  ${name}\n        esperado ${e}\n        obtuvo   ${a}`);
    failed++;
  }
}

const TEAMS = ["Suiza", "Colombia", "Argentina", "Egipto", "Brasil", "Francia"];
const ids: Record<string, string> = {};

async function reset() {
  await sql`DELETE FROM matches`;
  await sql`DELETE FROM teams`;
  for (const name of TEAMS) {
    const code = name.slice(0, 3).toUpperCase();
    const [r] = await sql`
      INSERT INTO teams (name, openfootball_name, fifa_code, flag_code)
      VALUES (${name}, ${name}, ${code}, ${code.toLowerCase()})
      RETURNING id`;
    ids[name] = r.id;
  }
}

type M = {
  num: number;
  stage: string;
  status: string;
  home?: string;
  away?: string;
  hs?: number;
  as?: number;
  sw?: string;
  hSrc?: number;
  hOut?: string;
  aSrc?: number;
  aOut?: string;
};

async function insert(m: M): Promise<string> {
  const [r] = await sql`
    INSERT INTO matches (
      openfootball_match_id, match_num, stage, status,
      home_team_id, away_team_id, home_score, away_score, shootout_winner,
      home_source_match_num, home_source_outcome,
      away_source_match_num, away_source_outcome,
      kickoff_at, venue
    ) VALUES (
      ${"t-" + m.num}, ${m.num}, ${m.stage}, ${m.status},
      ${m.home ? ids[m.home] : null}, ${m.away ? ids[m.away] : null},
      ${m.hs ?? null}, ${m.as ?? null}, ${m.sw ?? null},
      ${m.hSrc ?? null}, ${m.hOut ?? null},
      ${m.aSrc ?? null}, ${m.aOut ?? null},
      ${"2026-07-10T20:00:00Z"}, ${"Test"}
    ) RETURNING id`;
  return r.id as string;
}

/** Nombre del equipo en un slot, o null si sigue vacío. */
async function slotOf(num: number, side: "home" | "away") {
  const [r] =
    await sql`SELECT home_team_id, away_team_id FROM matches WHERE match_num=${num}`;
  const id = side === "home" ? r.home_team_id : r.away_team_id;
  if (!id) return null;
  return Object.keys(ids).find((n) => ids[n] === id) ?? "???";
}

console.log("\nCaso 1: slot vacío + ganador claro");
await reset();
await insert({ num: 95, stage: "round_of_16", status: "finished", home: "Argentina", away: "Egipto", hs: 3, as: 2 });
await insert({ num: 100, stage: "quarter", status: "scheduled", hSrc: 95, hOut: "W", aSrc: 96, aOut: "W" });
let r = await repairBracket();
check("repair devuelve propagated=1", r.propagated, 1);
check("#100.home = Argentina", await slotOf(100, "home"), "Argentina");

console.log("\nCaso 2: empate sin ganador por penales");
await reset();
await insert({ num: 96, stage: "round_of_16", status: "finished", home: "Suiza", away: "Colombia", hs: 0, as: 0 });
await insert({ num: 100, stage: "quarter", status: "scheduled", aSrc: 96, aOut: "W" });
r = await repairBracket();
check("no propaga (no adivina el ganador)", r.propagated, 0);
check("unresolved=1 (necesita la API)", r.unresolved, 1);
check("#100.away sigue vacío", await slotOf(100, "away"), null);

// El bug real: Suiza 0-0 Colombia (2026-07-07), penales 4-3, publicados tarde.
console.log("\nCaso 3: empate + shootout_winner");
await sql`UPDATE matches SET shootout_winner='home' WHERE match_num=96`;
r = await repairBracket();
check("propaga el ganador por penales", r.propagated, 1);
check("unresolved vuelve a 0", r.unresolved, 0);
check("#100.away = Suiza", await slotOf(100, "away"), "Suiza");

console.log("\nCaso 4: idempotencia");
r = await repairBracket();
check("segunda pasada no cambia nada", [r.propagated, r.corrected], [0, 0]);

console.log("\nCaso 5: slot obsoleto, downstream sin jugar");
await reset();
const m83 = await insert({ num: 83, stage: "round_of_32", status: "finished", home: "Brasil", away: "Francia", hs: 2, as: 1 });
await insert({ num: 93, stage: "round_of_16", status: "scheduled", home: "Brasil", hSrc: 83, hOut: "W" });
// Un admin corrige el score: ahora gana Francia, y el cuadro tiene que seguirlo.
await sql`UPDATE matches SET home_score=1, away_score=2 WHERE match_num=83`;
const direct = await propagateKnockoutResults(m83);
check("propagate reporta corrected=1", direct.corrected, 1);
check("#93.home pasa a Francia", await slotOf(93, "home"), "Francia");

console.log("\nCaso 6: slot obsoleto, downstream ya jugado (esperamos 1 console.error)");
await reset();
const m83b = await insert({ num: 83, stage: "round_of_32", status: "finished", home: "Brasil", away: "Francia", hs: 2, as: 1 });
await insert({ num: 93, stage: "round_of_16", status: "finished", home: "Brasil", away: "Egipto", hs: 1, as: 0, hSrc: 83, hOut: "W" });
await sql`UPDATE matches SET home_score=1, away_score=2 WHERE match_num=83`;
const d2 = await propagateKnockoutResults(m83b);
check("no reescribe un partido ya jugado", [d2.propagated, d2.corrected], [0, 0]);
check("#93.home sigue Brasil", await slotOf(93, "home"), "Brasil");
const r6 = await repairBracket();
check("tampoco lo cuenta como unresolved", r6.unresolved, 0);

console.log("\nCaso 7: tercer puesto propaga el perdedor");
await reset();
await insert({ num: 101, stage: "semi", status: "finished", home: "Argentina", away: "Brasil", hs: 2, as: 0 });
await insert({ num: 103, stage: "third_place", status: "scheduled", hSrc: 101, hOut: "L" });
await insert({ num: 104, stage: "final", status: "scheduled", hSrc: 101, hOut: "W" });
r = await repairBracket();
check("propaga 2 slots (final + 3er puesto)", r.propagated, 2);
check("#103.home = Brasil (perdedor)", await slotOf(103, "home"), "Brasil");
check("#104.home = Argentina (ganador)", await slotOf(104, "home"), "Argentina");

console.log("\nCaso 8: origen todavía no jugado");
await reset();
await insert({ num: 97, stage: "quarter", status: "scheduled", home: "Argentina", away: "Brasil" });
await insert({ num: 101, stage: "semi", status: "scheduled", hSrc: 97, hOut: "W" });
r = await repairBracket();
check("no propaga ni reporta unresolved", [r.propagated, r.unresolved], [0, 0]);

console.log(
  failed === 0 ? "\nTODOS LOS CASOS PASARON" : `\n${failed} CASOS FALLARON`,
);
await sql.end();
process.exit(failed === 0 ? 0 : 1);
