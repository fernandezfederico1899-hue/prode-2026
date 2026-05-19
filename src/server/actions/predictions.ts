"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { auth } from "@/lib/auth";

const submitSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(15),
  awayScore: z.number().int().min(0).max(15),
});

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Guarda o actualiza el pronóstico del usuario logueado para un partido.
 * Devuelve { ok: true } o { ok: false; error: ... }.
 */
export async function submitPredictionAction(
  input: unknown,
): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  if (session.user.status !== "approved") {
    return { ok: false, error: "not_approved" };
  }

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { matchId, homeScore, awayScore } = parsed.data;

  // Verificar que el match existe y que todavía no empezó.
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    columns: { id: true, kickoffAt: true, status: true },
  });
  if (!match) return { ok: false, error: "match_not_found" };
  if (match.kickoffAt.getTime() <= Date.now()) {
    return { ok: false, error: "match_locked" };
  }
  if (match.status !== "scheduled" && match.status !== "postponed") {
    return { ok: false, error: "match_locked" };
  }

  await db
    .insert(predictions)
    .values({
      userId: session.user.id,
      matchId,
      homeScore,
      awayScore,
    })
    .onConflictDoUpdate({
      target: [predictions.userId, predictions.matchId],
      set: { homeScore, awayScore, updatedAt: new Date() },
    });

  // Invalidamos las páginas que muestran predictions.
  revalidatePath("/matches");
  revalidatePath("/predict");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/");

  return { ok: true };
}

const deleteSchema = z.object({ matchId: z.string().uuid() });

/**
 * Borra el pronóstico del usuario logueado para un partido. Solo permitido
 * antes del kickoff (misma regla que submit).
 */
export async function deletePredictionAction(
  input: unknown,
): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  if (session.user.status !== "approved") {
    return { ok: false, error: "not_approved" };
  }

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { matchId } = parsed.data;

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    columns: { kickoffAt: true, status: true },
  });
  if (!match) return { ok: false, error: "match_not_found" };
  if (match.kickoffAt.getTime() <= Date.now()) {
    return { ok: false, error: "match_locked" };
  }
  if (match.status !== "scheduled" && match.status !== "postponed") {
    return { ok: false, error: "match_locked" };
  }

  await db
    .delete(predictions)
    .where(
      and(
        eq(predictions.userId, session.user.id),
        eq(predictions.matchId, matchId),
      ),
    );

  revalidatePath("/matches");
  revalidatePath("/predict");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/");

  return { ok: true };
}
