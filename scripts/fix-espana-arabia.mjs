// España vs Arabia Saudita estaba 5-0 en la DB; el resultado real (API) fue 4-0.
// Partido de grupos (sin penales). Corregimos el score.
// Después: node --env-file=.env.local scripts/reconcile-points.mjs --apply
import postgres from "postgres";
const sql = postgres(process.env.DIRECT_URL ?? process.env.DATABASE_URL, {
  prepare: false,
});
try {
  const rows = await sql`
    UPDATE matches m
    SET home_score = 4, away_score = 0, updated_at = now()
    FROM teams ht, teams at
    WHERE m.home_team_id = ht.id AND m.away_team_id = at.id
      AND ht.name = 'España' AND at.name = 'Arabia Saudita'
      AND m.status = 'finished'
    RETURNING m.match_num, m.home_score, m.away_score`;
  console.log(`Filas actualizadas: ${rows.length}`);
  for (const r of rows) console.log(`  España ${r.home_score}-${r.away_score} Arabia Saudita`);
} finally {
  await sql.end();
}
