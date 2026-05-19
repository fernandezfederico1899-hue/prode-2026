"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditLog, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

const userIdSchema = z.object({ userId: z.string().uuid() });

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  if (session.user.email !== env.ADMIN_EMAIL) return null;
  return session;
}

async function logAdminAction(
  adminEmail: string,
  action: string,
  targetType: string,
  targetId: string,
  before?: unknown,
  after?: unknown,
) {
  await db.insert(adminAuditLog).values({
    adminEmail,
    action,
    targetType,
    targetId,
    payloadBefore: (before ?? null) as never,
    payloadAfter: (after ?? null) as never,
  });
}

export async function approveUserAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "forbidden" };

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const target = await db.query.users.findFirst({
    where: eq(users.id, parsed.data.userId),
    columns: { id: true, email: true, status: true },
  });
  if (!target) return { ok: false, error: "user_not_found" };

  await db
    .update(users)
    .set({
      status: "approved",
      approvedAt: new Date(),
      approvedByEmail: session.user.email,
    })
    .where(eq(users.id, parsed.data.userId));

  await logAdminAction(
    session.user.email,
    "approve_user",
    "user",
    parsed.data.userId,
    { status: target.status },
    { status: "approved" },
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function rejectUserAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "forbidden" };

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const target = await db.query.users.findFirst({
    where: eq(users.id, parsed.data.userId),
    columns: { id: true, email: true, status: true },
  });
  if (!target) return { ok: false, error: "user_not_found" };

  await db
    .update(users)
    .set({ status: "rejected" })
    .where(eq(users.id, parsed.data.userId));

  await logAdminAction(
    session.user.email,
    "reject_user",
    "user",
    parsed.data.userId,
    { status: target.status },
    { status: "rejected" },
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}
