import Link from "next/link";
import { Shield } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { TeamLabel } from "@/components/common/team-label";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">PERFIL</h1>
      </header>

      <section className="rounded-xl border-2 border-border bg-card p-6 space-y-4">
        <Field label="Nombre" value={currentUser.name} />
        <Field label="Email" value="fernandezfederico1899@gmail.com" />
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Equipo favorito
          </span>
          <div className="mt-1">
            {currentUser.favoriteTeam ? (
              <TeamLabel team={currentUser.favoriteTeam} size="md" />
            ) : (
              <span className="text-muted-foreground">Sin elegir</span>
            )}
          </div>
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
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Notificaciones por mail</div>
            <div className="text-sm text-muted-foreground">
              Recordatorios 1h antes de cada partido
            </div>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-12 h-7 bg-muted rounded-full peer-checked:bg-primary transition-colors relative">
              <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
            </div>
          </label>
        </div>
      </section>

      {/* Admin access (solo visible si el usuario es admin — en mockup siempre se muestra) */}
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

      <div className="text-xs text-center text-muted-foreground">
        Mockup visual — sin DB ni auth real. Esto se conecta en M1.
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
        {label}
      </span>
      <div className="font-display text-2xl mt-0.5">{value}</div>
    </div>
  );
}
