import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { specialPredictions } from "@/db/schema";

export async function getUserSpecialPicks(userId: string) {
  const row = await db.query.specialPredictions.findFirst({
    where: eq(specialPredictions.userId, userId),
  });
  return row ?? null;
}
