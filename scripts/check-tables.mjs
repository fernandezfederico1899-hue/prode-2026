import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`;
console.log("Public tables:", rows.map((r) => r.table_name));

const migs = await sql`
  SELECT table_schema, table_name FROM information_schema.tables
  WHERE table_name LIKE '%migration%' OR table_schema LIKE 'drizzle%'
  ORDER BY table_schema, table_name
`;
console.log("Migrations tracking:", migs);
