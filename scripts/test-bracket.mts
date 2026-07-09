/**
 * Tests de la propagación del cuadro de eliminatorias (`propagate-knockouts.ts`).
 *
 * Corre contra un Postgres DESECHABLE: crea y borra tablas enteras. Nunca lo
 * apuntes a una base con datos que te importen — hay una guarda que solo acepta
 * localhost, pero la guarda no sabe si ese localhost es tu base de desarrollo.
 *
 * Uso:
 *   pnpm test            (este + test-sync-live)
 *   pnpm test:bracket
 *
 * Requiere una base vacía corriendo. Con PostgreSQL instalado (Windows tiene
 * los binarios en "C:\Program Files\PostgreSQL\<ver>\bin"):
 *
 *   initdb -D /tmp/pgdata -U postgres --auth=trust
 *   pg_ctl -D /tmp/pgdata -o "-p 55432" -l /tmp/pg.log start
 *   createdb -h localhost -p 55432 -U postgres prode_test
 *   export TEST_DATABASE_URL="postgresql://postgres@localhost:55432/prode_test"
 *   DIRECT_URL="$TEST_DATABASE_URL" DATABASE_URL="$TEST_DATABASE_URL" \
 *     npx drizzle-kit push --force
 *   pnpm test
 *
 * OJO con `drizzle-kit push`: `drizzle.config.ts` resuelve `DIRECT_URL ?? DATABASE_URL`
 * y carga `.env.local`, así que si no exportás DIRECT_URL el push va a PRODUCCIÓN.
 *
 * `.mts` (no `.ts`) porque tsx compila los `.ts` de este repo a CJS y el
 * top-level await no existe ahí. El `--tsconfig tsconfig.test.json` del npm
 * script mapea `server-only` a un stub: fuera de Next ese paquete tira error.
 */
import postgres from "postgres";
import { check, finish, Fixture, prepareTestEnv } from "./test-support.mjs";

const TEST_URL = prepareTestEnv();

const { propagateKnockoutResults, repairBracket } = await import(
  "@/server/scoring/propagate-knockouts"
);

const sql = postgres(TEST_URL, { prepare: false });
const fx = new Fixture(sql, [
  "Suiza",
  "Colombia",
  "Argentina",
  "Egipto",
  "Brasil",
  "Francia",
]);

console.log("\nCaso 1: slot vacío + ganador claro");
await fx.reset();
await fx.insert({ num: 95, stage: "round_of_16", status: "finished", home: "Argentina", away: "Egipto", hs: 3, as: 2 });
await fx.insert({ num: 100, stage: "quarter", status: "scheduled", hSrc: 95, hOut: "W", aSrc: 96, aOut: "W" });
let r = await repairBracket();
check("repair devuelve propagated=1", r.propagated, 1);
check("#100.home = Argentina", await fx.slotOf(100, "home"), "Argentina");

console.log("\nCaso 2: empate sin ganador por penales");
await fx.reset();
await fx.insert({ num: 96, stage: "round_of_16", status: "finished", home: "Suiza", away: "Colombia", hs: 0, as: 0 });
await fx.insert({ num: 100, stage: "quarter", status: "scheduled", aSrc: 96, aOut: "W" });
r = await repairBracket();
check("no propaga (no adivina el ganador)", r.propagated, 0);
check("unresolved=1 (necesita la API)", r.unresolved, 1);
check("#100.away sigue vacío", await fx.slotOf(100, "away"), null);

// El bug real: Suiza 0-0 Colombia (2026-07-07), penales 4-3, publicados tarde.
console.log("\nCaso 3: empate + shootout_winner");
await sql`UPDATE matches SET shootout_winner='home' WHERE match_num=96`;
r = await repairBracket();
check("propaga el ganador por penales", r.propagated, 1);
check("unresolved vuelve a 0", r.unresolved, 0);
check("#100.away = Suiza", await fx.slotOf(100, "away"), "Suiza");

console.log("\nCaso 4: idempotencia");
r = await repairBracket();
check("segunda pasada no cambia nada", [r.propagated, r.corrected], [0, 0]);

console.log("\nCaso 5: slot obsoleto, downstream sin jugar");
await fx.reset();
const m83 = await fx.insert({ num: 83, stage: "round_of_32", status: "finished", home: "Brasil", away: "Francia", hs: 2, as: 1 });
await fx.insert({ num: 93, stage: "round_of_16", status: "scheduled", home: "Brasil", hSrc: 83, hOut: "W" });
// Un admin corrige el score: ahora gana Francia, y el cuadro tiene que seguirlo.
await sql`UPDATE matches SET home_score=1, away_score=2 WHERE match_num=83`;
const direct = await propagateKnockoutResults(m83);
check("propagate reporta corrected=1", direct.corrected, 1);
check("#93.home pasa a Francia", await fx.slotOf(93, "home"), "Francia");

console.log("\nCaso 6: slot obsoleto, downstream ya jugado (esperamos 1 console.error)");
await fx.reset();
const m83b = await fx.insert({ num: 83, stage: "round_of_32", status: "finished", home: "Brasil", away: "Francia", hs: 2, as: 1 });
await fx.insert({ num: 93, stage: "round_of_16", status: "finished", home: "Brasil", away: "Egipto", hs: 1, as: 0, hSrc: 83, hOut: "W" });
await sql`UPDATE matches SET home_score=1, away_score=2 WHERE match_num=83`;
const d2 = await propagateKnockoutResults(m83b);
check("no reescribe un partido ya jugado", [d2.propagated, d2.corrected], [0, 0]);
check("#93.home sigue Brasil", await fx.slotOf(93, "home"), "Brasil");
const r6 = await repairBracket();
check("tampoco lo cuenta como unresolved", r6.unresolved, 0);

console.log("\nCaso 7: tercer puesto propaga el perdedor");
await fx.reset();
await fx.insert({ num: 101, stage: "semi", status: "finished", home: "Argentina", away: "Brasil", hs: 2, as: 0 });
await fx.insert({ num: 103, stage: "third_place", status: "scheduled", hSrc: 101, hOut: "L" });
await fx.insert({ num: 104, stage: "final", status: "scheduled", hSrc: 101, hOut: "W" });
r = await repairBracket();
check("propaga 2 slots (final + 3er puesto)", r.propagated, 2);
check("#103.home = Brasil (perdedor)", await fx.slotOf(103, "home"), "Brasil");
check("#104.home = Argentina (ganador)", await fx.slotOf(104, "home"), "Argentina");

console.log("\nCaso 8: origen todavía no jugado");
await fx.reset();
await fx.insert({ num: 97, stage: "quarter", status: "scheduled", home: "Argentina", away: "Brasil" });
await fx.insert({ num: 101, stage: "semi", status: "scheduled", hSrc: 97, hOut: "W" });
r = await repairBracket();
check("no propaga ni reporta unresolved", [r.propagated, r.unresolved], [0, 0]);

finish(sql);
