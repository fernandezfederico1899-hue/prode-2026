"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Lock } from "lucide-react";
import { updateTournamentConfigAction } from "@/server/actions/admin-config";

export function ConfigForm({
  initial,
  tournamentStarted,
  adminEmail,
}: {
  initial: { pozoAmountArs: number; tournamentStartsAt: string };
  tournamentStarted: boolean;
  adminEmail: string;
}) {
  const [pozo, setPozo] = useState(initial.pozoAmountArs);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateTournamentConfigAction({
        pozoAmountArs: pozo,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  // El kickoff del primer partido es source-of-truth para el lock del pozo.
  // No exponemos editar la fecha por simplicidad — viene del seed.
  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border-2 border-border bg-card p-6 space-y-5"
    >
      <Field
        label="Monto del pozo por jugador"
        description="En ARS. Se lockea automáticamente cuando arranca el Mundial."
        locked={tournamentStarted}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
            $
          </span>
          <input
            type="number"
            value={pozo}
            onChange={(e) => setPozo(Number(e.target.value))}
            disabled={tournamentStarted || isPending}
            min={0}
            step={1000}
            className="w-full pl-8 pr-3 py-3 rounded-md border-2 border-border bg-background font-display text-2xl tabular-nums focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>
      </Field>

      <Field
        label="Inicio del torneo"
        description="Source of truth: kickoff del primer partido del fixture."
        locked
      >
        <input
          type="text"
          value={new Date(initial.tournamentStartsAt).toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
            dateStyle: "long",
            timeStyle: "short",
          })}
          disabled
          className="w-full px-3 py-3 rounded-md border-2 border-border bg-muted font-semibold disabled:opacity-70"
        />
      </Field>

      <Field
        label="Admin email"
        description="Quien tiene acceso a /admin/*. Se cambia desde Vercel env vars (ADMIN_EMAIL)."
        locked
      >
        <input
          type="email"
          value={adminEmail}
          disabled
          className="w-full px-3 py-3 rounded-md border-2 border-border bg-muted font-mono text-sm disabled:opacity-70"
        />
      </Field>

      <div className="pt-3 border-t border-border">
        {tournamentStarted ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wide">
            <Lock className="w-4 h-4" />
            Pozo lockeado (el Mundial ya empezó)
          </div>
        ) : (
          <>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-md font-display text-xl tracking-wider hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-wait"
            >
              {saved ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Check className="w-5 h-5" />
                  GUARDADO
                </span>
              ) : isPending ? (
                "GUARDANDO..."
              ) : (
                "GUARDAR CAMBIOS"
              )}
            </button>
            {error && (
              <p className="mt-2 text-xs text-center text-destructive inline-flex items-center justify-center gap-1 w-full">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  description,
  locked,
  children,
}: {
  label: string;
  description: string;
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="font-bold uppercase tracking-wide text-sm">
          {label}
        </label>
        {locked && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Lock className="w-3 h-3" />
            Lock
          </span>
        )}
      </div>
      {children}
      <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
    </div>
  );
}
