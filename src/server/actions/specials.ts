"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { specialPredictions, tournamentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

const submitSchema = z.object({
  championTeamId: z.string().uuid().nullable(),
  runnerUpTeamId: z.string().uuid().nullable(),
  thirdPlaceTeamId: z.string().uuid().nullable(),
  mostGoalsTeamId: z.string().uuid().nullable(),
  topScorerPlayerId: z.string().uuid().nullable(),
  bestPlayerId: z.string().uuid().nullable(),
});

export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitSpecialPicksAction(
  input: unknown,
): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  if (session.user.status !== "approved") {
    return { ok: false, error: "not_approved" };
  }

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  // Lock: si el torneo ya empezó, no se aceptan cambios.
  const config = await db.query.tournamentConfig.findFirst({
    where: eq(tournamentConfig.id, 1),
    columns: { tournamentStartsAt: true },
  });
  if (!config) return { ok: false, error: "no_tournament_config" };
  if (config.tournamentStartsAt.getTime() <= Date.now()) {
    return { ok: false, error: "tournament_started" };
  }

  await db
    .insert(specialPredictions)
    .values({
      userId: session.user.id,
      championTeamId: parsed.data.championTeamId,
      runnerUpTeamId: parsed.data.runnerUpTeamId,
      thirdPlaceTeamId: parsed.data.thirdPlaceTeamId,
      mostGoalsTeamId: parsed.data.mostGoalsTeamId,
      topScorerPlayerId: parsed.data.topScorerPlayerId,
      bestPlayerId: parsed.data.bestPlayerId,
    })
    .onConflictDoUpdate({
      target: specialPredictions.userId,
      set: {
        championTeamId: parsed.data.championTeamId,
        runnerUpTeamId: parsed.data.runnerUpTeamId,
        thirdPlaceTeamId: parsed.data.thirdPlaceTeamId,
        mostGoalsTeamId: parsed.data.mostGoalsTeamId,
        topScorerPlayerId: parsed.data.topScorerPlayerId,
        bestPlayerId: parsed.data.bestPlayerId,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/specials");
  return { ok: true };
}
