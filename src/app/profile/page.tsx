import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserById } from "@/server/queries/users";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { SignOutButton } from "@/components/common/sign-out-button";
import { EditProfile } from "@/components/profile/edit-profile";
import { env } from "@/lib/env";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user?.id ? await getUserById(session.user.id) : null;

  const displayName = user?.name ?? session?.user?.name ?? "—";
  const displayEmail = user?.email ?? session?.user?.email ?? "—";
  const displayImage = user?.image ?? session?.user?.image ?? null;
  const isAdmin = displayEmail === env.ADMIN_EMAIL;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">PERFIL</h1>
      </header>

      <EditProfile initialName={displayName} initialImage={displayImage} />

      <section className="rounded-xl border-2 border-border bg-card p-6 space-y-2">
        <h2 className="font-display text-2xl">CUENTA</h2>
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Email
          </span>
          <div className="font-mono text-sm mt-0.5">{displayEmail}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Viene de tu cuenta de Google. No se puede cambiar.
          </p>
        </div>
      </section>

      <section className="rounded-xl border-2 border-border bg-card p-6 space-y-4">
        <h2 className="font-display text-2xl">PREFERENCIAS</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Tema</div>
            <div className="text-sm text-muted-foreground">
              Claro / oscuro / sistema
            </div>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {isAdmin && (
        <Link
          href="/admin"
          className="block rounded-xl border-2 border-secondary bg-secondary/5 p-4 hover:bg-secondary/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-secondary" />
            <div className="flex-1">
              <div className="font-bold uppercase tracking-wide">Modo admin</div>
              <div className="text-xs text-muted-foreground">
                Aprobar usuarios, corregir resultados, marcar pagos
              </div>
            </div>
            <span className="text-secondary font-bold">→</span>
          </div>
        </Link>
      )}

      {isAdmin && (
        <Link
          href="/champion"
          className="block rounded-xl border-2 border-dashed border-accent/50 bg-accent/5 p-4 hover:bg-accent/10 transition-colors"
        >
          <div className="flex items-center gap-3 text-accent">
            <Sparkles className="w-5 h-5" />
            <div className="flex-1">
              <div className="font-bold uppercase tracking-wide">
                Vista previa: campeón
              </div>
              <div className="text-xs text-muted-foreground">
                Cómo se ve la pantalla del ganador al final
              </div>
            </div>
          </div>
        </Link>
      )}

      <SignOutButton />
    </div>
  );
}
