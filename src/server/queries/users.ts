import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

/**
 * Trae los users con un determinado status. Si no se pasa filtro, devuelve todos.
 */
export async function getUsersByStatus(
  status?: "pending" | "approved" | "rejected",
): Promise<User[]> {
  if (!status) {
    return db.query.users.findMany({ orderBy: [asc(users.createdAt)] });
  }
  return db.query.users.findMany({
    where: eq(users.status, status),
    orderBy: [asc(users.createdAt)],
  });
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await db.query.users.findFirst({ where: eq(users.id, id) });
  return row ?? null;
}

export async function getApprovedCount(): Promise<number> {
  const rows = await getUsersByStatus("approved");
  return rows.length;
}
