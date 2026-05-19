import Link from "next/link";
import { Clock, Mail } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/15 text-accent">
          <Clock className="w-10 h-10" />
        </div>

        <div>
          <h1 className="font-display text-4xl md:text-5xl leading-none">
            ESPERANDO APROBACIÓN
          </h1>
          <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
            Te registraste con éxito. Federico te tiene que aprobar para que
            puedas entrar al prode.
          </p>
        </div>

        <div className="rounded-xl border-2 border-border bg-card p-5 text-sm space-y-3 text-left">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wide text-xs">
                Vas a recibir un mail
              </div>
              <p className="text-muted-foreground text-xs mt-1">
                Cuando el admin te apruebe te llega aviso. Después podés entrar
                normal con tu cuenta de Google.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            ← Cerrar sesión
          </Link>
        </div>

        {/* Mockup hint */}
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-[10px] text-muted-foreground">
          🚧 Mockup — en producción este estado se persiste en DB hasta que el
          admin aprueba o rechaza tu solicitud.
        </div>
      </div>
    </div>
  );
}
