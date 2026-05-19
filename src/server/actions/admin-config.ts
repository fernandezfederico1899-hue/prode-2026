"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditLog, tournamentConfig } from "@/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

const updateSchema = z.object({
  pozoAmountArs: z.number().int().min(0).max(10_000_000),
  tournamentStartsAt: z.string().datetime().optional(),
});

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  if (session.user.email !== env.ADMIN_EMAIL) return null;
  return session;
}

export async function updateTournamentConfigAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "forbidden" };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const before = await db.query.tournamentConfig.findFirst({
    where: eq(tournamentConfig.id, 1),
  });
  if (!before) return { ok: false, error: "no_config" };

  // Si el torneo ya empezó, no permitimos cambiar el pozo (decisión arq).
  if (
    before.tournamentStartsAt.getTime() <= Date.now() &&
    parsed.data.pozoAmountArs !== before.pozoAmountArs
  ) {
    return { ok: false, error: "pozo_locked" };
  }

  await db
    .update(tournamentConfig)
    .set({
      pozoAmountArs: parsed.data.pozoAmountArs,
      ...(parsed.data.tournamentStartsAt
        ? { tournamentStartsAt: new Date(parsed.data.tournamentStartsAt) }
        : {}),
    })
    .where(eq(tournamentConfig.id, 1));

  await db.insert(adminAuditLog).values({
    adminEmail: session.user.email,
    action: "change_pozo",
    targetType: "config",
    targetId: "1",
    payloadBefore: { pozoAmountArs: before.pozoAmountArs } as never,
    payloadAfter: { pozoAmountArs: parsed.data.pozoAmountArs } as never,
  });

  revalidatePath("/admin/config");
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/champion");
  revalidatePath("/specials");
  return { ok: true };
}
