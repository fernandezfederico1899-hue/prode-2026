import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tournamentConfig } from "@/db/schema";
import { env } from "@/lib/env";

const BASE_URL = `https://${env.API_SPORTS_HOST}`;

export type ApiSportsFixture = {
  fixture: {
    id: number;
    date: string; // ISO
    status: { long: string; short: string; elapsed: number | null };
  };
  league: { id: number; season: number };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
};

type ApiResponse<T> = {
  errors: unknown;
  results: number;
  response: T[];
};

class ApiSportsClient {
  private async call<T>(path: string): Promise<T[]> {
    if (!env.API_SPORTS_KEY) {
      throw new Error("API_SPORTS_KEY no configurada");
    }

    // Cuenta el request en la DB para no pasarnos del límite.
    await this.trackUsage();

    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "x-rapidapi-key": env.API_SPORTS_KEY,
        "x-rapidapi-host": env.API_SPORTS_HOST,
      },
      // No cachear — siempre queremos data fresca.
      cache: "no-store",
    });

    if (res.status === 429) {
      await this.markRateLimited();
      throw new Error("rate_limited");
    }
    if (!res.ok) {
      throw new Error(`api_sports_http_${res.status}`);
    }

    const json = (await res.json()) as ApiResponse<T>;
    // API-Sports tira errors como obj o array. Si tiene contenido, es error.
    const errs = json.errors;
    const hasErrors =
      (Array.isArray(errs) && errs.length > 0) ||
      (errs && typeof errs === "object" && Object.keys(errs).length > 0);
    if (hasErrors) {
      throw new Error(`api_sports_error: ${JSON.stringify(errs)}`);
    }
    return json.response;
  }

  /**
   * Trae todos los partidos en vivo a nivel global. Free plan permite esto.
   */
  async fetchLiveFixtures(): Promise<ApiSportsFixture[]> {
    return this.call<ApiSportsFixture>("/fixtures?live=all");
  }

  /**
   * Trae un fixture puntual por ID. Lo usamos para confirmar el final de un
   * partido que ya no aparece en live=all (los FT salen de ese feed).
   */
  async fetchFixtureById(id: number): Promise<ApiSportsFixture | null> {
    const res = await this.call<ApiSportsFixture>(`/fixtures?id=${id}`);
    return res[0] ?? null;
  }

  /**
   * Track requests/día en tournament_config.apiSportsDailyCount.
   * Resetea automático al cambiar la fecha.
   */
  private async trackUsage(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await db
      .update(tournamentConfig)
      .set({
        apiSportsDailyCount: sql`CASE
          WHEN ${tournamentConfig.apiSportsCountDate}::text = ${today}
            THEN ${tournamentConfig.apiSportsDailyCount} + 1
          ELSE 1
        END`,
        apiSportsCountDate: sql`${today}::date`,
      })
      .where(eq(tournamentConfig.id, 1));
  }

  private async markRateLimited(): Promise<void> {
    // Pausamos 2hs en caso de 429.
    const pauseUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await db
      .update(tournamentConfig)
      .set({ apiPausedUntil: pauseUntil })
      .where(eq(tournamentConfig.id, 1));
  }

  /**
   * `true` si todavía estamos en pausa por rate limit.
   */
  async isPaused(): Promise<boolean> {
    const cfg = await db.query.tournamentConfig.findFirst({
      where: eq(tournamentConfig.id, 1),
      columns: { apiPausedUntil: true },
    });
    if (!cfg?.apiPausedUntil) return false;
    return cfg.apiPausedUntil.getTime() > Date.now();
  }

  async getUsageToday(): Promise<{ count: number; limit: number }> {
    const cfg = await db.query.tournamentConfig.findFirst({
      where: eq(tournamentConfig.id, 1),
      columns: { apiSportsDailyCount: true, apiSportsCountDate: true },
    });
    const today = new Date().toISOString().slice(0, 10);
    const sameDay = cfg?.apiSportsCountDate === today;
    return {
      count: sameDay ? (cfg?.apiSportsDailyCount ?? 0) : 0,
      limit: 100,
    };
  }
}

export const apiSports = new ApiSportsClient();
