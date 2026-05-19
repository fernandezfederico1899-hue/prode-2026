"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditLog, matches } from "@/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { recalculateForMatch } from "@/server/scoring/recalculate";
import { propagateKnockoutResults } from "@/server/scoring/propagate-knockouts";

const correctSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
});

const transitionSchema = z.object({
  matchId: z.string().uuid(),
  newStatus: z.enum([
    "scheduled",
    "live",
    "finished",
    "postponed",
    "cancelled",
  ]),
});

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  if (session.user.email !== env.ADMIN_EMAIL) return null;
  return session;
}

/**
 * Setea el score final de un partido + lo marca como `finished`.
 * Dispara recalculate de puntos para todos los jugadores.
 */
export async function correctMatchScoreAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "forbidden" };

  const parsed = correctSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { matchId, homeScore, awayScore } = parsed.data;

  const before = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    columns: {
      id: true,
      homeScore: true,
      awayScore: true,
      status: true,
    },
  });
  if (!before) return { ok: false, error: "match_not_found" };

  await db
    .update(matches)
    .set({
      homeScore,
      awayScore,
      status: "finished",
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId));

  // Recalcular puntos de TODOS los jugadores para este match.
  await recalculateForMatch(matchId);
  // Si este match es KO, propagar el ganador/perdedor al siguiente.
  await propagateKnockoutResults(matchId);

  await db.insert(adminAuditLog).values({
    adminEmail: session.user.email,
    action: "correct_score",
    targetType: "match",
    targetId: matchId,
    payloadBefore: {
      homeScore: before.homeScore,
      awayScore: before.awayScore,
      status: before.status,
    } as never,
    payloadAfter: { homeScore, awayScore, status: "finished" } as never,
  });

  revalidatePath("/admin/matches");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/predict");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/groups");
  revalidatePath("/");

  return { ok: true };
}

/**
 * Cambia solo el status (sin tocar score). Útil para marcar live, postponed,
 * cancelled, o revertir un finished a scheduled (resetea el cálculo).
 */
export async function transitionMatchStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "forbidden" };

  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { matchId, newStatus } = parsed.data;

  const before = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    columns: { id: true, status: true },
  });
  if (!before) return { ok: false, error: "match_not_found" };

  await db
    .update(matches)
    .set({
      status: newStatus,
      updatedAt: new Date(),
      ...(newStatus !== "finished" ? { finishedAt: null } : {}),
    })
    .where(eq(matches.id, matchId));

  // Si dejó de estar finished, los puntos vuelven a null.
  if (before.status === "finished" && newStatus !== "finished") {
    await recalculateForMatch(matchId);
  }

  await db.insert(adminAuditLog).values({
    adminEmail: session.user.email,
    action: "transition_status",
    targetType: "match",
    targetId: matchId,
    payloadBefore: { status: before.status } as never,
    payloadAfter: { status: newStatus } as never,
  });

  revalidatePath("/admin/matches");
  revalidatePath("/predict");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/");

  return { ok: true };
}
