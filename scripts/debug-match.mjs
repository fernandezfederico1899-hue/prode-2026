// Estado de los últimos partidos jugados + sus predicciones con puntos.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT m.id, m.status, m.home_score, m.away_score, m.kickoff_at,
         m.last_synced_at, m.finished_at, m.api_sports_fixture_id,
         ht.name AS home, at.name AS away
  FROM matches m
  LEFT JOIN teams ht ON ht.id = m.home_team_id
  LEFT JOIN teams at ON at.id = m.away_team_id
  WHERE m.kickoff_at < now()
  ORDER BY m.kickoff_at DESC
  LIMIT 5
`;
console.log(JSON.stringify(rows, null, 2));
