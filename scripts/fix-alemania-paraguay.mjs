// Fix puntual: #74 se cargó Alemania 5-6 Paraguay porque la API sumó los
// penales al marcador. El real de los 90' fue 1-1 y Paraguay avanzó por
// penales. Corregimos el score a 1-1 y marcamos shootout_winner='away'
// (Paraguay, que ya estaba bien propagado al octavo #89).
// Después: node --env-file=.env.local scripts/reconcile-points.mjs --apply
import postgres from "postgres";
const sql = postgres(process.env.DIRECT_URL ?? process.env.DATABASE_URL, {
  prepare: false,
});
try {
  await sql`
    UPDATE matches
    SET home_score = 1, away_score = 1, shootout_winner = 'away', updated_at = now()
    WHERE match_num = 74`;
  console.log("#74 corregido a 1-1, shootout_winner=away (Paraguay)");

  const [check] = await sql`
    SELECT ht.name home, m.home_score, m.away_score, at.name away, m.shootout_winner
    FROM matches m
    LEFT JOIN teams ht ON ht.id = m.home_team_id
    LEFT JOIN teams at ON at.id = m.away_team_id
    WHERE m.match_num = 74`;
  console.log(`#74 ahora: ${check.home} ${check.home_score}-${check.away_score} ${check.away} (pen: ${check.shootout_winner})`);
} finally {
  await sql.end();
}
