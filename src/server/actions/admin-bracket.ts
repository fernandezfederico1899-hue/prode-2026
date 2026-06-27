"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditLog, matches } from "@/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  getGroupStandings,
  getBestThirdPlaceRanking,
} from "@/server/queries/standings";
import { resolveThirdPlaceSlots } from "@/server/knockouts/third-place";

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== env.ADMIN_EMAIL) {
    return null;
  }
  return session.user;
}

/**
 * Resuelve los slots determinísticos de KO (1X y 2X de cada grupo) cuando
 * todos los partidos de fase de grupos terminaron.
 *
 * Devuelve cuántos slots se asignaron + cuántos quedan pendientes (los
 * "3X/Y/Z/..." que requieren input manual del admin).
 */
export async function resolveKnockoutsAction(): Promise<
  ActionResult<{
    assigned: number;
    pendingManual: number;
    qualifiedThirdGroups: string[];
    thirdError: string | null;
  }>
> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "unauthorized" };

  const standings = await getGroupStandings();
  // Verificar que cada grupo tenga 3 partidos jugados por team (=4 teams × 3 = 12 / 2 = 6 matches finalizados).
  for (const [letter, list] of Object.entries(standings)) {
    const allPlayed3 = list.every((s) => s.played === 3);
    if (!allPlayed3) {
      return {
        ok: false,
        error: `group_not_finished:${letter}`,
      };
    }
  }

  // Map "1A" → teamId, "2A" → teamId, etc.
  const slotToTeamId = new Map<string, string>();
  for (const [letter, list] of Object.entries(standings)) {
    for (const s of list) {
      slotToTeamId.set(`${s.position}${letter}`, s.team.id);
    }
  }

  // Resolver los 8 mejores terceros con la tabla oficial FIFA. Si algo falla
  // (datos incompletos/corruptos), caemos a asignación manual: thirdAssignments
  // queda vacío y esos slots cuentan como pendingManual.
  let thirdAssignments: Record<number, string> = {};
  let thirdError: string | null = null;
  let qualifiedThirdGroups: string[] = [];
  try {
    const thirdRanking = await getBestThirdPlaceRanking();
    const resolved = resolveThirdPlaceSlots(thirdRanking);
    thirdAssignments = resolved.assignments;
    qualifiedThirdGroups = resolved.qualifiedGroups;
  } catch (e) {
    thirdError = e instanceof Error ? e.message : "third_place_failed";
  }

  // Iterar matches KO con algún lado sin resolver (home O away).
  const koMatches = await db.query.matches.findMany({
    where: and(
      eq(matches.stage, "round_of_32"),
      or(isNull(matches.homeTeamId), isNull(matches.awayTeamId)),
    ),
  });

  let assigned = 0;
  let pendingManual = 0;

  for (const m of koMatches) {
    // 1°/2° de grupo salen del slot determinístico; el tercero, de la tabla FIFA.
    let homeTeamId = m.homeSlot ? slotToTeamId.get(m.homeSlot) : undefined;
    let awayTeamId = m.awaySlot ? slotToTeamId.get(m.awaySlot) : undefined;
    if (!homeTeamId && m.homeSlot?.startsWith("3") && m.matchNum != null) {
      homeTeamId = thirdAssignments[m.matchNum];
    }
    if (!awayTeamId && m.awaySlot?.startsWith("3") && m.matchNum != null) {
      awayTeamId = thirdAssignments[m.matchNum];
    }

    if ((homeTeamId && !m.homeTeamId) || (awayTeamId && !m.awayTeamId)) {
      await db
        .update(matches)
        .set({
          ...(homeTeamId && !m.homeTeamId ? { homeTeamId } : {}),
          ...(awayTeamId && !m.awayTeamId ? { awayTeamId } : {}),
          updatedAt: new Date(),
        })
        .where(eq(matches.id, m.id));
      if (homeTeamId && !m.homeTeamId) assigned++;
      if (awayTeamId && !m.awayTeamId) assigned++;
    }

    if (!homeTeamId && m.homeSlot?.startsWith("3")) pendingManual++;
    if (!awayTeamId && m.awaySlot?.startsWith("3")) pendingManual++;
  }

  await db.insert(adminAuditLog).values({
    adminEmail: admin.email!,
    action: "resolve_knockouts",
    targetType: "bracket",
    targetId: "round_of_32",
    payloadAfter: {
      assigned,
      pendingManual,
      qualifiedThirdGroups,
      thirdError,
    } as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/bracket");
  revalidatePath("/bracket");
  revalidatePath("/predict");

  return {
    ok: true,
    data: { assigned, pendingManual, qualifiedThirdGroups, thirdError },
  };
}

const assignSchema = z.object({
  matchId: z.string().uuid(),
  side: z.enum(["home", "away"]),
  teamId: z.string().uuid().nullable(), // null para desasignar
});

/**
 * Asigna manualmente un team a un slot de un match KO (típicamente para los
 * slots de "tercero", o como override si algo salió mal en el auto-resolve).
 */
export async function assignKnockoutSlotAction(
  input: z.infer<typeof assignSchema>,
): Promise<ActionResult<void>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "unauthorized" };

  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { matchId, side, teamId } = parsed.data;
  const m = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    columns: { id: true, stage: true, homeTeamId: true, awayTeamId: true },
  });
  if (!m) return { ok: false, error: "not_found" };

  // Solo permitir asignar en matches de KO (no group).
  if (m.stage === "group") return { ok: false, error: "cannot_modify_group" };

  await db
    .update(matches)
    .set({
      ...(side === "home" ? { homeTeamId: teamId } : { awayTeamId: teamId }),
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId));

  await db.insert(adminAuditLog).values({
    adminEmail: admin.email!,
    action: "assign_ko_slot",
    targetType: "match",
    targetId: matchId,
    payloadBefore: {
      side,
      previous: side === "home" ? m.homeTeamId : m.awayTeamId,
    } as unknown as Record<string, unknown>,
    payloadAfter: { teamId } as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/bracket");
  revalidatePath("/bracket");
  revalidatePath("/predict");

  return { ok: true, data: undefined };
}
