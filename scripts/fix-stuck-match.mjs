// Marca como finished un match que quedó clavado en "live" (el sync solo mira
// /fixtures?live=all y el fixture desaparece de ese feed al terminar) y
// recalcula los puntos de sus predicciones con la regla 3 exacto / 1 signo.
// Uso: node scripts/fix-stuck-match.mjs <matchId>
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

const matchId = process.argv[2];
if (!matchId) {
  console.error("Uso: node scripts/fix-stuck-match.mjs <matchId>");
  process.exit(1);
}

const [match] = await sql`
  SELECT id, status, home_score, away_score FROM matches WHERE id = ${matchId}
`;
if (!match) {
  console.error("Match no encontrado");
  process.exit(1);
}
if (match.home_score === null || match.away_score === null) {
  console.error("Match sin score, no se puede finalizar");
  process.exit(1);
}

await sql`
  UPDATE matches
  SET status = 'finished', finished_at = now(), updated_at = now()
  WHERE id = ${matchId}
`;
console.log(`Match ${matchId} → finished (${match.home_score}-${match.away_score})`);

// Misma lógica que calculateMatchPoints en src/lib/scoring.ts
const preds = await sql`
  SELECT p.id, p.home_score, p.away_score, u.name AS user_name
  FROM predictions p JOIN users u ON u.id = p.user_id
  WHERE p.match_id = ${matchId}
`;

for (const p of preds) {
  let points = 0;
  if (p.home_score === match.home_score && p.away_score === match.away_score) {
    points = 3;
  } else if (
    Math.sign(p.home_score - p.away_score) ===
    Math.sign(match.home_score - match.away_score)
  ) {
    points = 1;
  }
  await sql`UPDATE predictions SET points = ${points} WHERE id = ${p.id}`;
  console.log(`  ${p.user_name}: ${p.home_score}-${p.away_score} → ${points} pts`);
}
console.log("Listo.");
