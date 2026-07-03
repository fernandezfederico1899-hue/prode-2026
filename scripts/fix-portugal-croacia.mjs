// Fix puntual: #83 se cargó Portugal 2-2 Croacia pero terminó 2-1 (gana
// Portugal). Corregimos el score, limpiamos shootout_winner (ya no es empate)
// y propagamos Portugal al slot W83 del octavo #93.
// Después correr: node --env-file=.env.local scripts/reconcile-points.mjs --apply
import postgres from "postgres";
const sql = postgres(process.env.DIRECT_URL ?? process.env.DATABASE_URL, {
  prepare: false,
});
try {
  const [m83] = await sql`
    SELECT id, home_team_id, away_team_id, home_score, away_score
    FROM matches WHERE match_num = 83`;

  await sql`
    UPDATE matches
    SET home_score = 2, away_score = 1, shootout_winner = NULL, updated_at = now()
    WHERE match_num = 83`;
  console.log("#83 corregido a 2-1 (Portugal)");

  const winnerId = m83.home_team_id; // Portugal (gana 2-1)

  const upd = await sql`
    UPDATE matches
    SET home_team_id = ${winnerId}, updated_at = now()
    WHERE match_num = 93
      AND home_source_match_num = 83
      AND home_source_outcome = 'W'
      AND home_team_id IS NULL
    RETURNING match_num`;
  console.log(`#93 home actualizado: ${upd.length} fila(s)`);

  const [check] = await sql`
    SELECT ht.name AS home, at.name AS away
    FROM matches m
    LEFT JOIN teams ht ON ht.id = m.home_team_id
    LEFT JOIN teams at ON at.id = m.away_team_id
    WHERE m.match_num = 93`;
  console.log(`\n#93 ahora: ${check.home} vs ${check.away}`);
} finally {
  await sql.end();
}
