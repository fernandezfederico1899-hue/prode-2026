import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { env } from "@/lib/env";

// ============================================================
// Type augmentation
// ============================================================
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      status?: "pending" | "approved" | "rejected";
      isAdmin?: boolean;
    };
  }
}

// ============================================================
// Providers (Google siempre, Resend si está la API key)
// ============================================================
const baseProviders = [
  Google({
    clientId: env.AUTH_GOOGLE_ID,
    clientSecret: env.AUTH_GOOGLE_SECRET,
    authorization: {
      params: {
        scope: "openid email profile",
        prompt: "select_account",
      },
    },
  }),
];

const allProviders =
  env.RESEND_API_KEY && env.RESEND_FROM
    ? [
        ...baseProviders,
        Resend({
          apiKey: env.RESEND_API_KEY,
          from: env.RESEND_FROM,
        }),
      ]
    : baseProviders;

// ============================================================
// NextAuth config
// ============================================================

/**
 * Auth.js v5 — config principal.
 *
 * Estrategia:
 * - Adapter Drizzle persiste users + accounts en nuestra DB.
 * - Sessions vía JWT (no DB query por request).
 * - Cada usuario nuevo se crea con status = 'pending' (default en schema).
 * - El admin lo aprueba/rechaza desde /admin/users.
 */
export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: allProviders,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login?check-email=1",
  },
  callbacks: {
    /**
     * JWT callback: corre cada vez que se crea o actualiza el token.
     * Enriquecemos el token con datos custom (status, isAdmin).
     */
    async jwt({ token, user }) {
      // En el primer login `user` viene del adapter
      const userId = (user?.id as string | undefined) ?? token.sub;

      if (userId) {
        const row = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
          columns: { status: true, email: true },
        });
        if (row) {
          // Auto-aprobar al admin en su primer login. Si el email matchea
          // ADMIN_EMAIL y el status quedó `pending` (default), lo subimos a
          // `approved` para que no se quede trabado en /pending.
          if (row.email === env.ADMIN_EMAIL && row.status === "pending") {
            await db
              .update(users)
              .set({
                status: "approved",
                approvedAt: new Date(),
                approvedByEmail: row.email,
              })
              .where(eq(users.id, userId));
            row.status = "approved";
          }

          return {
            ...token,
            id: userId,
            status: row.status,
            isAdmin: row.email === env.ADMIN_EMAIL,
          };
        }
      }

      return token;
    },

    /**
     * Session callback: el objeto que llega al cliente vía useSession() / auth().
     */
    async session({ session, token }) {
      const t = token as typeof token & {
        id?: string;
        status?: "pending" | "approved" | "rejected";
        isAdmin?: boolean;
      };
      if (session.user) {
        if (t.id) session.user.id = t.id;
        session.user.status = t.status;
        session.user.isAdmin = Boolean(t.isAdmin);
      }
      return session;
    },

    async signIn() {
      // Por ahora todos pueden registrarse. La whitelist real está en el flujo
      // self-signup → admin approval.
      return true;
    },
  },
  trustHost: true,
  secret: env.AUTH_SECRET,
});
