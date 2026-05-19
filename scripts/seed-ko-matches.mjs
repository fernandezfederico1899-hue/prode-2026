// Seedea los 32 partidos de KO (R32 → Final) desde openfootball/wc2026.json.
// Guarda: openfootball_match_id, match_num, home/away_slot (label original),
// y para KO post-R32, home/away_source_match_num + _outcome (W/L).
//
// Idempotente: borra y re-inserta los 32 KO para evitar drift de schema.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL no configurada");
const sql = neon(DB_URL);

const ROUND_TO_STAGE = {
  "Round of 32": "round_of_32",
  "Round of 16": "round_of_16",
  "Quarter-final": "quarter",
  "Semi-final": "semi",
  "Match for third place": "third_place",
  Final: "final",
};

function parseKickoff(date, time) {
  const m = time.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)$/);
  if (!m) throw new Error(`Time inválido: ${time}`);
  const [, hh, mm, tz] = m;
  const sign = tz.startsWith("-") ? "-" : "+";
  const tzNum = Math.abs(parseInt(tz, 10));
  const offset = `${sign}${String(tzNum).padStart(2, "0")}:00`;
  return new Date(`${date}T${hh}:${mm}:00${offset}`);
}

/**
 * Parsea un slot como "W74" → { num: 74, outcome: 'W' }, "L101" → { num: 101, outcome: 'L' },
 * "1A" o "3A/B/C/D/F" → null (no es source, se resuelve desde group standings).
 */
function parseSlot(slot) {
  const m = slot.match(/^([WL])(\d+)$/);
  if (!m) return null;
  return { outcome: m[1], num: parseInt(m[2], 10) };
}

async function main() {
  const raw = readFileSync(resolve("src/data/wc2026.json"), "utf-8");
  const data = JSON.parse(raw);
  const all = data.matches ?? [];
  const koRounds = Object.keys(ROUND_TO_STAGE);
  const koMatches = all.filter((m) => koRounds.includes(m.round));

  console.log(`Encontrados ${koMatches.length} partidos KO`);

  // Borrar los KO existentes para re-seed limpio.
  const deleted = await sql`
    DELETE FROM matches WHERE stage != 'group'
    RETURNING openfootball_match_id
  `;
  console.log(`Borrados ${deleted.length} KO previos`);

  // 3er puesto y Final no traen num en openfootball — los asignamos.
  const NUM_OVERRIDES = {
    "Match for third place": 103,
    Final: 104,
  };

  let inserted = 0;
  for (const m of koMatches) {
    const num = m.num ?? NUM_OVERRIDES[m.round];
    if (!num) {
      console.warn(`Skipping ${m.round} sin num`);
      continue;
    }
    const id = `wc2026-${num}`;
    const stage = ROUND_TO_STAGE[m.round];
    const kickoff = parseKickoff(m.date, m.time);
    const homeSrc = parseSlot(m.team1);
    const awaySrc = parseSlot(m.team2);

    await sql`
      INSERT INTO matches (
        openfootball_match_id, match_num,
        home_team_id, away_team_id,
        home_slot, away_slot,
        home_source_match_num, home_source_outcome,
        away_source_match_num, away_source_outcome,
        kickoff_at, venue, stage, status
      ) VALUES (
        ${id}, ${num},
        NULL, NULL,
        ${m.team1}, ${m.team2},
        ${homeSrc?.num ?? null}, ${homeSrc?.outcome ?? null},
        ${awaySrc?.num ?? null}, ${awaySrc?.outcome ?? null},
        ${kickoff.toISOString()}, ${m.ground}, ${stage}, 'scheduled'
      )
    `;
    inserted++;
  }

  console.log(`\n${inserted} KO matches insertados`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
