"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bracketPicks, matches } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getKnockoutTree } from "@/server/queries/bracket";

// El bracket se cierra cuando arranca el primer 16avo (match #73).
const FIRST_KO_MATCH_NUM = 73;

const pickSchema = z.object({
  matchNum: z.number().int().min(73).max(104),
  winnerTeamId: z.string().uuid(),
});
const saveSchema = z.object({
  picks: z.array(pickSchema).max(31),
});

export type SaveBracketResult = { ok: true } | { ok: false; error: string };

/**
 * Guarda el cuadro de eliminatorias del usuario. Reemplaza el bracket completo
 * (borra + reinserta) para que el estado en DB siempre refleje el payload.
 *
 * Valida la cadena de avance: cada ganador elegido debe ser uno de los dos
 * contendientes del cruce — para 16avos los equipos reales; para rondas
 * siguientes, los ganadores que el propio usuario eligió en los dos cruces de
 * origen (presentes en el mismo payload).
 */
export async function saveBracketPicksAction(
  input: unknown,
): Promise<SaveBracketResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  if (session.user.status !== "approved") {
    return { ok: false, error: "not_approved" };
  }

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const { picks } = parsed.data;

  // Lock global: si el primer 16avo ya empezó, el bracket está cerrado.
  const firstKo = await db.query.matches.findFirst({
    where: eq(matches.matchNum, FIRST_KO_MATCH_NUM),
    columns: { kickoffAt: true },
  });
  if (firstKo && firstKo.kickoffAt.getTime() <= Date.now()) {
    return { ok: false, error: "locked" };
  }

  // Validar consistencia de la cadena de avance contra el árbol real.
  const tree = await getKnockoutTree();
  const nodeByNum = new Map(tree.map((n) => [n.matchNum, n]));
  const pickByNum = new Map(picks.map((p) => [p.matchNum, p.winnerTeamId]));

  for (const p of picks) {
    const node = nodeByNum.get(p.matchNum);
    if (!node) return { ok: false, error: "invalid_match" };

    const contenders =
      node.stage === "round_of_32"
        ? [node.homeTeam?.id, node.awayTeam?.id]
        : [
            node.homeSourceMatchNum != null
              ? pickByNum.get(node.homeSourceMatchNum)
              : undefined,
            node.awaySourceMatchNum != null
              ? pickByNum.get(node.awaySourceMatchNum)
              : undefined,
          ];

    if (!contenders.includes(p.winnerTeamId)) {
      return { ok: false, error: "inconsistent" };
    }
  }

  const userId = session.user.id;
  await db.transaction(async (tx) => {
    await tx.delete(bracketPicks).where(eq(bracketPicks.userId, userId));
    if (picks.length > 0) {
      await tx.insert(bracketPicks).values(
        picks.map((p) => ({
          userId,
          matchNum: p.matchNum,
          winnerTeamId: p.winnerTeamId,
        })),
      );
    }
  });

  revalidatePath("/bracket/predict");
  revalidatePath("/bracket");
  revalidatePath("/");

  return { ok: true };
}
