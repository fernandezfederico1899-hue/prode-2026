// Backfill: sincroniza TODOS los partidos finalizados del Mundial contra
// football-data y recalcula puntos (3/1/0). Para ponerse al día tras el apagón
// del sync. Idempotente.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const TEAM_ALIASES = {
  usa: "unitedstates", czechrepublic: "czechia",
  capeverde: "capeverdeislands", drcongo: "congodr",
};
const alias = (n) => TEAM_ALIASES[n] ?? n;
const calcPoints = (ph, pa, rh, ra) =>
  ph === rh && pa === ra ? 3 : Math.sign(ph - pa) === Math.sign(rh - ra) ? 1 : 0;

const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
  headers: { "X-Auth-Token": TOKEN },
});
const { matches: fdMatches } = await res.json();
const fdFinished = fdMatches.filter(
  (m) => (m.status === "FINISHED" || m.status === "AWARDED") &&
         m.score?.fullTime?.home != null,
);
console.log(`football-data: ${fdFinished.length} partidos finalizados`);

// Index de football-data por par de equipos normalizado.
const fdByPair = new Map();
for (const m of fdFinished) {
  fdByPair.set(`${norm(m.homeTeam.name)}|${norm(m.awayTeam.name)}`, m);
}

const dbMatches = await sql`
  SELECT m.id, m.status, m.home_score, m.away_score,
         ht.openfootball_name AS home_off, at.openfootball_name AS away_off,
         ht.name AS home, at.name AS away
  FROM matches m
  JOIN teams ht ON ht.id = m.home_team_id
  JOIN teams at ON at.id = m.away_team_id
`;

let closed = 0, recalced = 0, notFound = 0;
for (const dm of dbMatches) {
  const key = `${alias(norm(dm.home_off))}|${alias(norm(dm.away_off))}`;
  const fd = fdByPair.get(key);
  if (!fd) continue; // no finalizado en football-data o no es del WC
  const rh = fd.score.fullTime.home, ra = fd.score.fullTime.away;

  const needsClose = dm.status !== "finished" || dm.home_score !== rh || dm.away_score !== ra;
  if (needsClose) {
    await sql`
      UPDATE matches SET status = 'finished', home_score = ${rh}, away_score = ${ra},
        finished_at = COALESCE(finished_at, now()), last_synced_at = now(), updated_at = now()
      WHERE id = ${dm.id}
    `;
    console.log(`  CERRADO ${dm.home} ${rh}-${ra} ${dm.away} (estaba ${dm.status} ${dm.home_score}-${dm.away_score})`);
    closed++;
  }

  // Recalcular puntos de este match (idempotente).
  const preds = await sql`SELECT id, home_score, away_score, points FROM predictions WHERE match_id = ${dm.id}`;
  for (const p of preds) {
    const pts = calcPoints(p.home_score, p.away_score, rh, ra);
    if (pts !== p.points) {
      await sql`UPDATE predictions SET points = ${pts} WHERE id = ${p.id}`;
      recalced++;
    }
  }
}
console.log(`\nCerrados: ${closed} | predicciones recalculadas: ${recalced}`);

const lb = await sql`
  SELECT u.name, COALESCE(SUM(p.points),0)::int AS pts
  FROM users u LEFT JOIN predictions p ON p.user_id = u.id
  WHERE u.status = 'approved' GROUP BY u.name ORDER BY pts DESC
`;
console.log("\nLEADERBOARD:");
for (const r of lb) console.log(`  ${r.name.padEnd(22)} ${r.pts}`);
