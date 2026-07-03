// Dry-run de la red de seguridad: compara el score guardado en la DB contra el
// que devuelve la API (90' + prórroga = fullTime - penalties) y el ganador.
// No escribe nada.
import postgres from "postgres";

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
  headers: { "X-Auth-Token": TOKEN },
});
const { matches: apiMatches } = await res.json();
const byId = new Map(apiMatches.map((m) => [m.id, m]));

const norm = (ft, pen) => (ft == null ? null : ft - (pen ?? 0));

try {
  const rows = await sql`
    SELECT m.match_num, m.stage, m.status, m.api_sports_fixture_id AS fid,
           m.home_score, m.away_score, m.shootout_winner,
           ht.name home, at.name away
    FROM matches m
    LEFT JOIN teams ht ON ht.id = m.home_team_id
    LEFT JOIN teams at ON at.id = m.away_team_id
    WHERE m.status = 'finished' AND m.api_sports_fixture_id IS NOT NULL`;

  let drift = 0;
  for (const r of rows) {
    const api = byId.get(r.fid);
    if (!api) { console.log(`#${r.match_num} fid=${r.fid} NO está en la API`); continue; }
    const s = api.score;
    const gh = norm(s.fullTime?.home, s.penalties?.home);
    const ga = norm(s.fullTime?.away, s.penalties?.away);
    const apiPen = s.winner === "HOME_TEAM" ? "home" : s.winner === "AWAY_TEAM" ? "away" : null;
    // shootout solo relevante si empate a 90+ET
    const wantShootout = gh === ga ? apiPen : null;
    const scoreDrift = gh !== r.home_score || ga !== r.away_score;
    const shootDrift = wantShootout !== r.shootout_winner && gh === ga;
    if (scoreDrift || shootDrift) {
      drift++;
      console.log(
        `#${r.match_num} ${r.home} vs ${r.away} [${s.duration}]\n` +
        `   DB:  ${r.home_score}-${r.away_score} pen=${r.shootout_winner}\n` +
        `   API: ${gh}-${ga} pen=${wantShootout}  (fullTime ${s.fullTime?.home}-${s.fullTime?.away}, pens ${s.penalties?.home ?? "-"}-${s.penalties?.away ?? "-"})`,
      );
    }
  }
  console.log(`\n${rows.length} finalizados chequeados, ${drift} con diferencias`);
} finally {
  await sql.end();
}
