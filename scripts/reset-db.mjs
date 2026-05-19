// Script de un solo uso para resetear el schema durante M1.
// Borra todo el schema public y lo recrea vacío. Usar SOLO en dev.
// node scripts/reset-db.mjs

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no definida en .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log("⚠️  Resetting schemas public + drizzle (drops everything)...");
await sql`DROP SCHEMA IF EXISTS public CASCADE`;
await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
await sql`CREATE SCHEMA public`;
await sql`GRANT ALL ON SCHEMA public TO neondb_owner`;
await sql`GRANT ALL ON SCHEMA public TO public`;
console.log("✓ Reset done. Empty schema ready for fresh migration.");
