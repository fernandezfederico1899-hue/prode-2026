// Borra un usuario por nombre (case-insensitive). Las FKs son ON DELETE
// CASCADE, así que se llevan predicciones, especiales y sesiones.
// Uso: node scripts/delete-user.mjs <nombre> [--confirm]
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

const name = process.argv[2];
const confirm = process.argv.includes("--confirm");
if (!name) {
  console.error("Uso: node scripts/delete-user.mjs <nombre> [--confirm]");
  process.exit(1);
}

const found = await sql`
  SELECT id, name, email, status FROM users WHERE name ILIKE ${name}
`;
if (found.length !== 1) {
  console.error(`Esperaba 1 match exacto, encontré ${found.length}:`);
  console.error(JSON.stringify(found, null, 2));
  process.exit(1);
}
const user = found[0];
console.log(`Usuario: ${user.name} <${user.email}> [${user.status}] ${user.id}`);

const [preds] = await sql`SELECT count(*)::int AS n FROM predictions WHERE user_id = ${user.id}`;
const [specials] = await sql`SELECT count(*)::int AS n FROM special_predictions WHERE user_id = ${user.id}`;
console.log(`  Predicciones: ${preds.n} | Especiales: ${specials.n}`);

if (!confirm) {
  console.log("Dry-run. Agregá --confirm para borrar.");
  process.exit(0);
}

await sql`DELETE FROM users WHERE id = ${user.id}`;
console.log("Borrado (cascade incluido).");
