// Restaura los JSON de backup/ a la DB destino (Supabase).
// Asume que el schema YA fue creado con `drizzle-kit migrate`.
// Desactiva los FK checks de sesión (session_replication_role=replica) dentro de
// una transacción para no depender del orden de carga. Supabase lo permite al
// rol `postgres` (no así DISABLE TRIGGER, que toca triggers de sistema).
// Uso: DIRECT_URL=... node scripts/restore-supabase.mjs
import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL/DATABASE_URL no definida");

// Session mode (5432): permite DDL y DISABLE TRIGGER. prepare:false por las dudas.
const sql = postgres(url, { prepare: false });

const files = readdirSync("backup").filter(
  (f) => f.endsWith(".json") && !f.startsWith("_"),
);

// Cargamos primero los datos en memoria.
const data = {};
for (const f of files) {
  const t = f.replace(/\.json$/, "");
  data[t] = JSON.parse(readFileSync(`backup/${f}`, "utf8"));
}

try {
  await sql.begin(async (tx) => {
    // Solo para esta transacción: ignora FK checks → orden de carga irrelevante.
    await tx`set local session_replication_role = replica`;
    for (const [table, rows] of Object.entries(data)) {
      if (!rows.length) {
        console.log(`  ${table}: 0 filas (skip)`);
        continue;
      }
      const cols = Object.keys(rows[0]);
      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        await tx`insert into ${tx(table)} ${tx(chunk, ...cols)} on conflict do nothing`;
      }
      console.log(`  ${table}: ${rows.length} filas`);
    }
  });
  console.log("\nRestore OK ✅");
} catch (e) {
  console.error("FALLO:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
