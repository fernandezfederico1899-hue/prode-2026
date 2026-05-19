"use server";

import { revalidatePath } from "next/cache";
import { eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditLog, players, teams, tournamentConfig } from "@/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

type SyncOneResult =
  | {
      ok: true;
      teamId: string;
      teamName: string;
      inserted: number;
      updated: number;
    }
  | { ok: false; teamId: string; teamName: string; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== env.ADMIN_EMAIL) {
    return null;
  }
  return session.user;
}

type ApiPlayer = {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
};

type ApiSquadResponse = {
  errors: unknown;
  response: Array<{
    team: { id: number; name: string };
    players: ApiPlayer[];
  }>;
};

async function fetchSquad(apiSportsTeamId: number): Promise<ApiPlayer[]> {
  const url = `https://${env.API_SPORTS_HOST}/players/squads?team=${apiSportsTeamId}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": env.API_SPORTS_KEY!,
      "x-rapidapi-host": env.API_SPORTS_HOST,
    },
    cache: "no-store",
  });
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ApiSquadResponse;
  const errs = data.errors;
  const hasErrors =
    (Array.isArray(errs) && errs.length > 0) ||
    (errs && typeof errs === "object" && Object.keys(errs).length > 0);
  if (hasErrors) {
    throw new Error(JSON.stringify(errs));
  }
  return data.response?.[0]?.players ?? [];
}

async function trackApiUsage(): Promise<void> {
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

/**
 * Devuelve la lista de team IDs eligibles para sync (mapeados a API-Sports
 * y NO synceados hoy). El cliente itera sobre esta lista.
 */
export async function getEligibleRosterTeamsAction(): Promise<
  Array<{ id: string; name: string }>
> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      rosterSyncedAt: teams.rosterSyncedAt,
    })
    .from(teams)
    .where(isNotNull(teams.apiSportsId));

  return rows
    .filter((r) => !r.rosterSyncedAt || r.rosterSyncedAt < startOfToday)
    .map(({ id, name }) => ({ id, name }));
}

/**
 * Sincroniza el roster de un único team. Pensado para llamarse iterativamente
 * desde el cliente respetando rate limit con sleep client-side.
 */
export async function syncOneRosterAction(
  teamId: string,
): Promise<SyncOneResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      ok: false,
      teamId,
      teamName: "?",
      error: "unauthorized",
    };
  }

  if (!env.API_SPORTS_KEY) {
    return {
      ok: false,
      teamId,
      teamName: "?",
      error: "api_sports_not_configured",
    };
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: { id: true, name: true, apiSportsId: true },
  });
  if (!team || !team.apiSportsId) {
    return {
      ok: false,
      teamId,
      teamName: team?.name ?? "?",
      error: "team_not_mapped",
    };
  }

  try {
    const squad = await fetchSquad(team.apiSportsId);
    await trackApiUsage();

    let inserted = 0;
    let updated = 0;

    for (const p of squad) {
      const existing = await db.query.players.findFirst({
        where: eq(players.apiSportsPlayerId, p.id),
        columns: { id: true },
      });

      const data = {
        name: p.name,
        teamId: team.id,
        position: p.position,
        photoUrl: p.photo,
        shirtNumber: p.number,
        age: p.age,
      };

      if (existing) {
        await db.update(players).set(data).where(eq(players.id, existing.id));
        updated++;
      } else {
        await db.insert(players).values({
          apiSportsPlayerId: p.id,
          ...data,
        });
        inserted++;
      }
    }

    await db
      .update(teams)
      .set({ rosterSyncedAt: new Date() })
      .where(eq(teams.id, team.id));

    await db.insert(adminAuditLog).values({
      adminEmail: admin.email!,
      action: "sync_roster_team",
      targetType: "team",
      targetId: team.id,
      payloadAfter: { name: team.name, inserted, updated } as unknown as Record<
        string,
        unknown
      >,
    });

    revalidatePath("/admin/rosters");

    return {
      ok: true,
      teamId: team.id,
      teamName: team.name,
      inserted,
      updated,
    };
  } catch (err) {
    return {
      ok: false,
      teamId: team.id,
      teamName: team.name,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
