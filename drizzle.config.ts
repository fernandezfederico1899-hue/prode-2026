import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Cargar .env.local primero (overrides) y .env como defaults.
config({ path: ".env.local" });
config({ path: ".env" });

// Para DDL/migraciones usamos la conexión directa (session mode, 5432) si está
// disponible; el pooler en transaction mode (6543) no es apto para migraciones.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error("DATABASE_URL/DIRECT_URL no está definida. Copiá .env.example a .env.local y completala.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
  verbose: true,
  strict: true,
});
