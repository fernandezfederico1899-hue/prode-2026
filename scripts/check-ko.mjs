// Diagnóstico del estado de los cruces de eliminatorias.
// Uso: node --env-file=.env.local scripts/check-ko.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const byStage = await sql`
    SELECT stage, status, count(*)::int AS n,
           count(home_team_id)::int AS with_home,
           count(away_team_id)::int AS with_away
    FROM matches
    GROUP BY stage, status
    ORDER BY 1, 2`;
  console.log("=== matches por stage/status ===");
  for (const r of byStage)
    console.log(
      `${String(r.stage).padEnd(13)} ${String(r.status).padEnd(10)} n=${r.n} home=${r.with_home} away=${r.with_away}`,
    );

  const [g] = await sql`
    SELECT count(*) FILTER (WHERE stage='group')::int AS total,
           count(*) FILTER (WHERE stage='group' AND status='finished')::int AS fin
    FROM matches`;
  console.log(`\nGrupos: ${g.fin}/${g.total} finalizados`);

  // Primeros KO por kickoff: ver slots y si ya tienen equipos resueltos.
  const next = await sql`
    SELECT match_num, stage, status, home_slot, away_slot,
           home_team_id IS NOT NULL AS has_home,
           away_team_id IS NOT NULL AS has_away,
           kickoff_at
    FROM matches
    WHERE stage <> 'group'
    ORDER BY kickoff_at
    LIMIT 8`;
  console.log("\n=== primeros 8 KO por kickoff ===");
  for (const r of next)
    console.log(
      `#${r.match_num} ${String(r.stage).padEnd(11)} ${String(r.status).padEnd(9)} ${String(r.home_slot ?? "-").padEnd(11)} vs ${String(r.away_slot ?? "-").padEnd(11)} home=${r.has_home} away=${r.has_away}`,
    );

  const cfg = await sql`
    SELECT id, pool_locked, tournament_starts_at, bonus_resolved_at
    FROM tournament_config`;
  console.log("\n=== tournament_config ===");
  console.log(JSON.stringify(cfg, null, 2));
} finally {
  await sql.end();
}
