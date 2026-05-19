"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  adminAuditLog,
  specialPredictions,
  tournamentConfig,
  type BonusResults,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { calculateBonusPoints } from "@/lib/scoring";

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== env.ADMIN_EMAIL) {
    return null;
  }
  return session.user;
}

const setSchema = z.object({
  championTeamId: z.string().uuid().nullable().optional(),
  runnerUpTeamId: z.string().uuid().nullable().optional(),
  thirdPlaceTeamId: z.string().uuid().nullable().optional(),
  topScorerPlayerId: z.string().uuid().nullable().optional(),
  bestPlayerId: z.string().uuid().nullable().optional(),
  mostGoalsTeamId: z.string().uuid().nullable().optional(),
});

/**
 * Guarda los resultados finales del torneo (champion, top scorer, etc.) en
 * tournament_config.bonus_results. NO calcula bonus todavía — para eso usar
 * resolveBonusAction().
 */
export async function setBonusResultsAction(
  input: z.infer<typeof setSchema>,
): Promise<ActionResult<void>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "unauthorized" };

  const parsed = setSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const current = await db.query.tournamentConfig.findFirst({
    where: eq(tournamentConfig.id, 1),
    columns: { bonusResults: true },
  });

  // Merge con lo que ya esté guardado (permite updates parciales).
  const merged: BonusResults = { ...(current?.bonusResults ?? {}) };
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === null) {
      delete merged[k as keyof BonusResults];
    } else if (v !== undefined) {
      (merged as Record<string, string>)[k] = v;
    }
  }

  await db
    .update(tournamentConfig)
    .set({ bonusResults: merged })
    .where(eq(tournamentConfig.id, 1));

  await db.insert(adminAuditLog).values({
    adminEmail: admin.email!,
    action: "set_bonus_results",
    targetType: "tournament_config",
    targetId: "1",
    payloadBefore: (current?.bonusResults ?? {}) as unknown as Record<
      string,
      unknown
    >,
    payloadAfter: merged as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/bonus");
  return { ok: true, data: undefined };
}

/**
 * Recalcula bonus_points en cada special_prediction usando los results
 * actuales del tournament_config. Marca el momento en bonus_resolved_at.
 */
export async function resolveBonusAction(): Promise<
  ActionResult<{ updated: number; totalBonus: number }>
> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "unauthorized" };

  const config = await db.query.tournamentConfig.findFirst({
    where: eq(tournamentConfig.id, 1),
    columns: { bonusResults: true },
  });
  if (!config?.bonusResults) {
    return { ok: false, error: "no_results_set" };
  }

  const results = config.bonusResults;

  const allPreds = await db.query.specialPredictions.findMany();

  let updated = 0;
  let totalBonus = 0;
  for (const p of allPreds) {
    const bonus = calculateBonusPoints(
      {
        championTeamId: p.championTeamId,
        runnerUpTeamId: p.runnerUpTeamId,
        thirdPlaceTeamId: p.thirdPlaceTeamId,
        topScorerPlayerId: p.topScorerPlayerId,
        bestPlayerId: p.bestPlayerId,
        mostGoalsTeamId: p.mostGoalsTeamId,
      },
      {
        championTeamId: results.championTeamId ?? null,
        runnerUpTeamId: results.runnerUpTeamId ?? null,
        thirdPlaceTeamId: results.thirdPlaceTeamId ?? null,
        topScorerPlayerId: results.topScorerPlayerId ?? null,
        bestPlayerId: results.bestPlayerId ?? null,
        mostGoalsTeamId: results.mostGoalsTeamId ?? null,
      },
    );
    if (bonus !== p.bonusPoints) {
      await db
        .update(specialPredictions)
        .set({ bonusPoints: bonus, updatedAt: new Date() })
        .where(eq(specialPredictions.id, p.id));
      updated++;
    }
    totalBonus += bonus;
  }

  await db
    .update(tournamentConfig)
    .set({ bonusResolvedAt: new Date() })
    .where(eq(tournamentConfig.id, 1));

  await db.insert(adminAuditLog).values({
    adminEmail: admin.email!,
    action: "resolve_bonus",
    targetType: "tournament_config",
    targetId: "1",
    payloadAfter: { updated, totalBonus } as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/bonus");
  revalidatePath("/leaderboard");
  revalidatePath("/");
  return { ok: true, data: { updated, totalBonus } };
}
