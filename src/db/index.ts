import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Cliente Drizzle conectado a Supabase Postgres vía el transaction pooler
 * (Supavisor, puerto 6543). En modo transacción NO se pueden usar prepared
 * statements, por eso `prepare: false`.
 *
 * Para nuestro caso (pocos users, queries cortas en Vercel functions) el pooler
 * compartido alcanza y sobra. Las migraciones usan la conexión directa (5432).
 */
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, {
  schema,
  logger: env.NODE_ENV === "development",
});

export type DB = typeof db;
export * from "./schema";
