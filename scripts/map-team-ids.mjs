// Mapea cada team de la DB a su api_sports_id correspondiente buscando por
// nombre en /teams?name=X y filtrando por national=true.
//
// Uso: node --env-file=.env.local scripts/map-team-ids.mjs
//
// Output: actualiza teams.api_sports_id en la DB y deja un cache JSON en
// src/data/api-sports-team-ids.json para que sea idempotente.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const API_KEY = process.env.API_SPORTS_KEY;
const DB_URL = process.env.DATABASE_URL;
if (!API_KEY) throw new Error("API_SPORTS_KEY no configurada");
if (!DB_URL) throw new Error("DATABASE_URL no configurada");

const sql = neon(DB_URL);
const CACHE_PATH = resolve("src/data/api-sports-team-ids.json");

// Overrides para nombres que API-Sports no resuelve con /teams?name= exacto.
// Key: openfootball_name (nuestro), Value: alternativa para search.
const NAME_OVERRIDES = {
  USA: "United States",
  "Bosnia & Herzegovina": "Bosnia",
  "Ivory Coast": "Ivoire",
  "Czech Republic": "Czechia",
  "DR Congo": "Congo DR",
  "South Korea": "Korea Republic",
};

async function fetchTeam(name) {
  const search = NAME_OVERRIDES[name] ?? name;
  // `search` es fuzzy (handles "South Africa", "Czechia" etc.); `name` es exact.
  const url = `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(search)}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${name}`);
  const data = await res.json();
  if (data.errors?.length) {
    throw new Error(`API error para ${name}: ${JSON.stringify(data.errors)}`);
  }
  // Excluir youth (U17/U19/U20/U21/U23) y women (W).
  const YOUTH_RE = /\bU(1[5-9]|2[0-3])\b|Women|Olympic/i;
  const candidates = (data.response ?? [])
    .filter((r) => r.team?.national)
    .filter((r) => !YOUTH_RE.test(r.team?.name ?? ""));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].team;
  // Si hay varios, preferimos el match exacto (case-insensitive).
  const exact = candidates.find(
    (c) => c.team.name.toLowerCase() === name.toLowerCase(),
  );
  return (exact ?? candidates[0]).team;
}

async function main() {
  const cache = existsSync(CACHE_PATH)
    ? JSON.parse(readFileSync(CACHE_PATH, "utf-8"))
    : {};

  const teams = await sql`
    SELECT id, openfootball_name, name, api_sports_id
    FROM teams
    ORDER BY openfootball_name
  `;

  console.log(`Procesando ${teams.length} teams...\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let apiCalls = 0;

  for (const team of teams) {
    const name = team.openfootball_name;
    // Si ya está en cache y en DB, skip.
    if (cache[name] && team.api_sports_id === cache[name].id) {
      console.log(`  ⏭️  ${name.padEnd(25)} (cached: ${cache[name].id})`);
      skipped++;
      continue;
    }

    try {
      const apiTeam = await fetchTeam(name);
      apiCalls++;
      if (!apiTeam) {
        console.log(`  ❌ ${name.padEnd(25)} (sin match)`);
        failed++;
        continue;
      }
      cache[name] = { id: apiTeam.id, name: apiTeam.name, country: apiTeam.country };
      await sql`
        UPDATE teams SET api_sports_id = ${apiTeam.id} WHERE id = ${team.id}
      `;
      console.log(
        `  ✅ ${name.padEnd(25)} → ${apiTeam.name} (id=${apiTeam.id})`,
      );
      updated++;
      // Rate limit: 10 r/m en free. Sleep 15s = 4 r/m (margen seguro).
      await new Promise((r) => setTimeout(r, 15000));
    } catch (err) {
      console.error(`  💥 ${name}: ${err.message}`);
      failed++;
    }
  }

  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");

  console.log(`\nResumen:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Cached/skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  API calls: ${apiCalls}`);
  console.log(`\nCache: ${CACHE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
