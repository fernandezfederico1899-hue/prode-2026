import Link from "next/link";
import { XCircle } from "lucide-react";

export default function RejectedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/15 text-destructive">
          <XCircle className="w-10 h-10" />
        </div>

        <div>
          <h1 className="font-display text-4xl md:text-5xl leading-none">
            SOLICITUD RECHAZADA
          </h1>
          <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
            El admin del prode rechazó tu solicitud. Si te parece que es un
            error, escribile directo a Federico.
          </p>
        </div>

        <div className="rounded-xl border-2 border-border bg-card p-5 text-sm text-left">
          <div className="font-bold uppercase tracking-wide text-xs mb-1">
            Admin
          </div>
          <div className="text-muted-foreground">
            fernandezfederico1899@gmail.com
          </div>
        </div>

        <Link
          href="/login"
          className="inline-block text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          ← Volver al login
        </Link>

        {/* Mockup hint */}
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-[10px] text-muted-foreground">
          🚧 Mockup — esta pantalla solo aparece si el admin marca tu solicitud
          como rechazada desde el panel.
        </div>
      </div>
    </div>
  );
}
