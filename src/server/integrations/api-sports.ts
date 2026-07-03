import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tournamentConfig } from "@/db/schema";
import { env } from "@/lib/env";

// NOTA: este módulo era un cliente de API-Football (api-sports.io). Migrado a
// football-data.org (2026-06-14) tras suspensiones repetidas por exceder el
// límite de 100 req/día. football-data free da 10 req/MIN y cubre el Mundial.
// Mantenemos el nombre del archivo, el export `apiSports` y el shape
// `ApiSportsFixture` para no tocar el resto del código (sync-live.ts).

const BASE_URL = "https://api.football-data.org/v4";
const WC_COMPETITION = "WC"; // FIFA World Cup (id 2000)

// Shape interno que consume sync-live.ts. Lo mantenemos estable: adaptamos la
// respuesta de football-data a esta forma.
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
  // Resultado que cuenta para el puntaje: 90' + prórroga, SIN penales.
  goals: { home: number | null; away: number | null };
  // Ganador real (incluye penales) y duración, para resolver el avance del KO.
  result: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: string | null; // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
  };
};

// --- Tipos de football-data.org (parcial, solo lo que usamos) ---
type FdTeam = { id: number; name: string };
type FdMatch = {
  id: number;
  utcDate: string;
  status: string; // SCHEDULED|TIMED|IN_PLAY|PAUSED|FINISHED|SUSPENDED|POSTPONED|CANCELLED|AWARDED
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: string | null;
    // fullTime = regularTime + extraTime + penalties (agregado final).
    fullTime: { home: number | null; away: number | null };
    // Solo presente si hubo definición por penales.
    penalties?: { home: number | null; away: number | null } | null;
  };
};
type FdMatchesResponse = { matches: FdMatch[] };

// status de football-data → código corto que entiende STATUS_MAP en sync-live.
const FD_STATUS_TO_SHORT: Record<string, string> = {
  FINISHED: "FT",
  AWARDED: "FT",
  IN_PLAY: "1H",
  PAUSED: "HT",
  TIMED: "NS",
  SCHEDULED: "NS",
  // SUSPENDED/POSTPONED/CANCELLED: no mapeamos → applyFixture mantiene el status actual.
};

// Resta los penales al marcador agregado para quedarnos con 90' + prórroga.
// En vivo/sin penales `pen` es null → devuelve el marcador tal cual.
function minusPenalties(full: number | null | undefined, pen: number | null | undefined): number | null {
  if (full === null || full === undefined) return null;
  return full - (pen ?? 0);
}

function adaptMatch(m: FdMatch): ApiSportsFixture {
  return {
    fixture: {
      id: m.id,
      date: m.utcDate,
      status: {
        long: m.status,
        short: FD_STATUS_TO_SHORT[m.status] ?? m.status,
        elapsed: null,
      },
    },
    league: { id: 2000, season: 2026 },
    teams: {
      home: { id: m.homeTeam.id, name: m.homeTeam.name },
      away: { id: m.awayTeam.id, name: m.awayTeam.name },
    },
    // El puntaje cuenta 90' + prórroga, no los penales. football-data mete el
    // shootout dentro de fullTime (fullTime = reg + ET + pens), así que lo
    // restamos. El ganador por penales se resuelve aparte con result.winner.
    goals: {
      home: minusPenalties(m.score?.fullTime?.home, m.score?.penalties?.home),
      away: minusPenalties(m.score?.fullTime?.away, m.score?.penalties?.away),
    },
    result: {
      winner: m.score?.winner ?? null,
      duration: m.score?.duration ?? null,
    },
  };
}

class FootballDataClient {
  private async call<T>(path: string): Promise<T> {
    if (!env.FOOTBALL_DATA_TOKEN) {
      throw new Error("FOOTBALL_DATA_TOKEN no configurada");
    }

    // Cuenta el request en la DB (telemetría / red de seguridad).
    await this.trackUsage();

    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "X-Auth-Token": env.FOOTBALL_DATA_TOKEN },
      cache: "no-store",
    });

    if (res.status === 429) {
      await this.markRateLimited();
      throw new Error("rate_limited");
    }
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`football_data_http_${res.status}: ${txt.slice(0, 200)}`);
    }

    return (await res.json()) as T;
  }

  /**
   * Trae TODOS los partidos del Mundial en una sola llamada (104). Incluye los
   * FINISHED, así que no hace falta un fallback por ID: el estado actual de cada
   * partido siempre está acá. El nombre se mantiene por compatibilidad.
   */
  async fetchLiveFixtures(): Promise<ApiSportsFixture[]> {
    const data = await this.call<FdMatchesResponse>(
      `/competitions/${WC_COMPETITION}/matches`,
    );
    return (data.matches ?? []).map(adaptMatch);
  }

  /**
   * Trae un partido puntual por ID de football-data. Fallback defensivo.
   */
  async fetchFixtureById(id: number): Promise<ApiSportsFixture | null> {
    try {
      const m = await this.call<FdMatch>(`/matches/${id}`);
      return m?.id ? adaptMatch(m) : null;
    } catch {
      return null;
    }
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
    // football-data limita por MINUTO (10/min en free). Pausa corta: 5 min.
    const pauseUntil = new Date(Date.now() + 5 * 60 * 1000);
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
      // football-data free no tiene tope diario duro (solo 10/min). Dejamos un
      // tope informativo alto como red de seguridad ante loops.
      limit: 500,
    };
  }
}

export const apiSports = new FootballDataClient();
