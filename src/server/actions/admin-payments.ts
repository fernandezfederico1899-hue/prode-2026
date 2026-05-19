"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditLog, payments } from "@/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

const schema = z.object({
  userId: z.string().uuid(),
  paid: z.boolean(),
});

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  if (session.user.email !== env.ADMIN_EMAIL) return null;
  return session;
}

export async function markPaymentAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "forbidden" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  await db
    .insert(payments)
    .values({
      userId: parsed.data.userId,
      paid: parsed.data.paid,
      paidAt: parsed.data.paid ? new Date() : null,
      markedByEmail: session.user.email,
    })
    .onConflictDoUpdate({
      target: payments.userId,
      set: {
        paid: parsed.data.paid,
        paidAt: parsed.data.paid ? new Date() : null,
        markedByEmail: session.user.email,
      },
    });

  await db.insert(adminAuditLog).values({
    adminEmail: session.user.email,
    action: parsed.data.paid ? "mark_payment" : "unmark_payment",
    targetType: "user",
    targetId: parsed.data.userId,
    payloadAfter: { paid: parsed.data.paid } as never,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  return { ok: true };
}
