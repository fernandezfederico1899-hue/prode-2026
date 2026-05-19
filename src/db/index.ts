import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Cliente Drizzle conectado a Neon vía HTTP (serverless-friendly).
 *
 * Para queries en transacciones largas o sesiones persistentes usar el driver
 * WebSocket (`@neondatabase/serverless` con `Pool`). Para nuestro caso (15 users,
 * queries cortas, Vercel functions) HTTP alcanza y es más rápido en cold start.
 */
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema, logger: env.NODE_ENV === "development" });

export type DB = typeof db;
export * from "./schema";
