// Fix puntual: #75 (Países Bajos 1-1 Marruecos) terminó sin shootout_winner,
// por eso el octavo #90 quedó "Canadá vs (vacío)". Marruecos avanzó por penales.
// Seteamos el shootout_winner y propagamos el ganador al slot away de #90.
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
try {
  const [m75] = await sql`
    SELECT id, home_score, away_score, home_team_id, away_team_id, shootout_winner
    FROM matches WHERE match_num = 75`;
  if (m75.home_score !== m75.away_score) {
    throw new Error("#75 no es empate, revisar a mano");
  }
  // Marruecos es el away de #75.
  await sql`UPDATE matches SET shootout_winner = 'away', updated_at = now()
            WHERE match_num = 75`;
  const winnerId = m75.away_team_id; // Marruecos

  // Propagar al octavo #90 (away_source_match_num=75, outcome='W') si está vacío.
  const upd = await sql`
    UPDATE matches
    SET away_team_id = ${winnerId}, updated_at = now()
    WHERE match_num = 90
      AND away_source_match_num = 75
      AND away_source_outcome = 'W'
      AND away_team_id IS NULL
    RETURNING match_num`;
  console.log(`shootout_winner #75 = away (Marruecos)`);
  console.log(`#90 away actualizado: ${upd.length} fila(s)`);

  const [check] = await sql`
    SELECT ht.name AS home, at.name AS away
    FROM matches m
    LEFT JOIN teams ht ON ht.id = m.home_team_id
    LEFT JOIN teams at ON at.id = m.away_team_id
    WHERE m.match_num = 90`;
  console.log(`\n#90 ahora: ${check.home} vs ${check.away}`);
} finally {
  await sql.end();
}
