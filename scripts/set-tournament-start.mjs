// Mueve tournament_starts_at (lock de los pronósticos especiales).
// Uso: node scripts/set-tournament-start.mjs "2026-06-12T19:00:00Z"
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

const newDate = process.argv[2];
if (!newDate || isNaN(Date.parse(newDate))) {
  console.error('Uso: node scripts/set-tournament-start.mjs "<ISO date>"');
  process.exit(1);
}

const [before] = await sql`SELECT tournament_starts_at FROM tournament_config WHERE id = 1`;
console.log("Antes: ", before.tournament_starts_at);

await sql`
  UPDATE tournament_config
  SET tournament_starts_at = ${newDate}
  WHERE id = 1
`;

const [after] = await sql`SELECT tournament_starts_at FROM tournament_config WHERE id = 1`;
console.log("Ahora: ", after.tournament_starts_at);
