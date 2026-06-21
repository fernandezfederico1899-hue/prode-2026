// Dump completo de la DB de Neon a archivos JSON (backup/).
// Robusto: descubre las tablas desde information_schema, no asume nombres.
// Uso: node scripts/dump-neon.mjs   (lee DATABASE_URL de .env.local / .env)
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no definida");

const sql = neon(url);
const OUT = "backup";
mkdirSync(OUT, { recursive: true });

const tables = await sql`
  select table_name from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
  order by table_name`;

const summary = {};
for (const { table_name } of tables) {
  // Identificador no parametrizable: lo interpolamos validado contra catalog.
  const rows = await sql.query(`select * from "${table_name}"`);
  writeFileSync(`${OUT}/${table_name}.json`, JSON.stringify(rows, null, 2));
  summary[table_name] = rows.length;
  console.log(`  ${table_name}: ${rows.length} filas`);
}

writeFileSync(`${OUT}/_summary.json`, JSON.stringify(summary, null, 2));
console.log("\nDump OK →", OUT + "/");
