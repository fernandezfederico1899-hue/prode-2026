import { Coins, ListChecks, Trophy } from "lucide-react";
import { GoogleButton } from "@/components/login/google-button";

export default function LoginPage() {
  return (
    <div className="min-h-screen panini-pattern flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-8">
          {/* Hero */}
          <div className="text-center">
            <div className="inline-block text-6xl mb-3">⚽</div>
            <h1 className="font-display text-6xl md:text-7xl leading-none">
              <span className="text-primary">PRODE</span>{" "}
              <span className="text-foreground">2026</span>
            </h1>
            <p className="font-display text-lg text-muted-foreground mt-2 tracking-wider">
              MUNDIAL · USA · CANADÁ · MÉXICO
            </p>
          </div>

          {/* Card de login */}
          <div className="rounded-xl border-2 border-border bg-card p-6 md:p-8 space-y-6">
            <div className="text-center">
              <h2 className="font-display text-2xl">EL PRODE ENTRE AMIGOS</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Iniciá sesión con tu cuenta de Google para empezar.
              </p>
            </div>

            <GoogleButton callbackUrl="/" />

            <div className="text-xs text-center text-muted-foreground border-t border-border pt-4">
              Si ya jugaste antes, tu cuenta ya está aprobada y entrás directo.
              <br />
              Si es tu primera vez, el admin te tiene que aprobar.
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <Feature
              icon={<ListChecks className="w-5 h-5" />}
              label="Pronósticos"
              description="Cargá tu prono partido por partido"
            />
            <Feature
              icon={<Trophy className="w-5 h-5" />}
              label="Especiales"
              description="Campeón, goleador y más bonus"
            />
            <Feature
              icon={<Coins className="w-5 h-5" />}
              label="Pozo"
              description="El ganador se lleva todo"
            />
          </div>

          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
            Prode privado · acceso solo a invitados
          </p>
        </div>
      </div>

    </div>
  );
}

function Feature({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-md border-2 border-border bg-card p-3 text-center">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary mb-1.5">
        {icon}
      </div>
      <div className="font-bold uppercase tracking-wide text-xs">{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
        {description}
      </div>
    </div>
  );
}
