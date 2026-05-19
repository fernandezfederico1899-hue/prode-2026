import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditLog, payments, users } from "@/db/schema";

export async function getAuditLogEntries(limit = 50) {
  return db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(limit);
}

export type PaymentRow = {
  userId: string;
  userName: string;
  userEmail: string;
  paid: boolean;
  paidAt: Date | null;
};

export async function getAllPayments(): Promise<PaymentRow[]> {
  const rows = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      paid: payments.paid,
      paidAt: payments.paidAt,
    })
    .from(users)
    .leftJoin(payments, eq(payments.userId, users.id))
    .where(eq(users.status, "approved"))
    .orderBy(users.name);

  return rows.map((r) => ({
    userId: r.userId,
    userName: r.userName,
    userEmail: r.userEmail,
    paid: r.paid ?? false,
    paidAt: r.paidAt,
  }));
}
