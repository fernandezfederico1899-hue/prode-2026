import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side env vars. Solo accesibles en server components, server actions,
   * API routes y otros archivos server-only.
   */
  server: {
    DATABASE_URL: z.string().url().startsWith("postgres"),
    AUTH_SECRET: z.string().min(32).optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    ADMIN_EMAIL: z.string().email(),
    CRON_SECRET: z.string().min(16).optional(),
    API_SPORTS_KEY: z.string().optional(),
    API_SPORTS_HOST: z.string().default("v3.football.api-sports.io"),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM: z.string().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Client-side env vars. Deben tener prefijo NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },

  /**
   * Runtime env. Next.js no expone process.env directamente en Edge runtime,
   * así que mapeamos manualmente.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    CRON_SECRET: process.env.CRON_SECRET,
    API_SPORTS_KEY: process.env.API_SPORTS_KEY,
    API_SPORTS_HOST: process.env.API_SPORTS_HOST,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  /**
   * Saltar validación en tiempo de build (útil para Docker builds o CI sin
   * acceso a env vars). En runtime sí valida.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Tratar strings vacíos como undefined (Next.js parsea env vars vacíos como "").
   */
  emptyStringAsUndefined: true,
});
