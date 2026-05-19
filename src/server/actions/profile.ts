"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

const updateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(30, "Máximo 30 caracteres"),
});

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function updateProfileNameAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };

  const parsed = updateNameSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "invalid_input",
    };
  }

  await db
    .update(users)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  revalidatePath("/");
  return { ok: true };
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadAvatarAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  if (!env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, error: "blob_not_configured" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "no_file" };
  if (file.size === 0) return { ok: false, error: "empty_file" };
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "file_too_large" };
  }
  if (!ALLOWED_MIMES.includes(file.type)) {
    return { ok: false, error: "invalid_type" };
  }

  // Path único por usuario + timestamp para evitar cache stale.
  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `avatars/${session.user.id}-${Date.now()}.${ext}`;

  const blob = await put(path, file, {
    access: "public",
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });

  await db
    .update(users)
    .set({ image: blob.url, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return { ok: true, data: { url: blob.url } };
}

export async function removeAvatarAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };

  await db
    .update(users)
    .set({ image: null, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  return { ok: true };
}
