"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { tournamentConfig } from "@/lib/mock-data";

export default function AdminConfigPage() {
  const [pozoAmount, setPozoAmount] = useState(tournamentConfig.pozoAmountArs);
  const [saved, setSaved] = useState(false);
  const locked = false; // en el mock, dejar editable para mostrar la UI

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">CONFIG</h1>
        <p className="text-muted-foreground mt-1">
          Parámetros del torneo. Algunos se lockean al primer kickoff.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border-2 border-border bg-card p-6 space-y-5"
      >
        <Field
          label="Monto del pozo por jugador"
          description="En ARS. Cada jugador pone esto. Se lockea cuando arranca el Mundial."
          locked={locked}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
              $
            </span>
            <input
              type="number"
              value={pozoAmount}
              onChange={(e) => setPozoAmount(Number(e.target.value))}
              disabled={locked}
              min={0}
              step={1000}
              className="w-full pl-8 pr-3 py-3 rounded-md border-2 border-border bg-background font-display text-2xl tabular-nums focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </Field>

        <Field
          label="Fecha de inicio del torneo"
          description="Define cuándo se lockean los pronósticos especiales y el pozo."
          locked={locked}
        >
          <input
            type="datetime-local"
            defaultValue="2026-06-11T12:00"
            disabled={locked}
            className="w-full px-3 py-3 rounded-md border-2 border-border bg-background font-semibold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </Field>

        <Field
          label="Email del admin"
          description="Quién puede acceder a este panel. Cambia desde env vars de Vercel en producción."
          locked
        >
          <input
            type="email"
            value="fernandezfederico1899@gmail.com"
            disabled
            className="w-full px-3 py-3 rounded-md border-2 border-border bg-muted font-mono text-sm disabled:opacity-70"
          />
        </Field>

        <div className="pt-3 border-t border-border">
          {locked ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wide">
              <Lock className="w-4 h-4" />
              Config lockeada (el Mundial ya empezó)
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-md font-display text-xl tracking-wider hover:opacity-90 transition-opacity"
            >
              {saved ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Check className="w-5 h-5" />
                  GUARDADO
                </span>
              ) : (
                "GUARDAR CAMBIOS"
              )}
            </button>
          )}
        </div>
      </form>

      <div className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-5">
        <h2 className="font-display text-xl text-destructive mb-2">ZONA PELIGROSA</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Acciones irreversibles que afectan el torneo.
        </p>
        <button
          type="button"
          className="w-full py-2.5 border-2 border-destructive text-destructive rounded-md text-sm font-bold uppercase tracking-wide hover:bg-destructive/10 transition-colors"
        >
          Resincronizar fixture desde openfootball
        </button>
      </div>
    </div>
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
        <label className="font-bold uppercase tracking-wide text-sm">{label}</label>
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
