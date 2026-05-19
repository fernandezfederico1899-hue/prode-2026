"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Lock } from "lucide-react";
import type { MatchWithTeams } from "@/lib/types";
import { ScoreInput } from "@/components/match/score-input";
import { submitPredictionAction } from "@/server/actions/predictions";

export function PredictForm({
  match,
  initialHome,
  initialAway,
  locked,
}: {
  match: MatchWithTeams;
  initialHome: number;
  initialAway: number;
  locked: boolean;
}) {
  const [home, setHome] = useState(initialHome);
  const [away, setAway] = useState(initialAway);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await submitPredictionAction({
            matchId: match.id,
            homeScore: home,
            awayScore: away,
          });
          if (!result.ok) {
            setError(errorMessage(result.error));
            return;
          }
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        });
      }}
      className="rounded-xl border-2 border-border bg-card p-6 md:p-8"
    >
      <ScoreInput
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeScore={home}
        awayScore={away}
        onChange={(h, a) => {
          setHome(h);
          setAway(a);
        }}
        disabled={locked || isPending}
      />

      <div className="mt-8 space-y-3">
        {locked ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wide">
            <Lock className="w-4 h-4" />
            Pronóstico cerrado (partido ya empezó)
          </div>
        ) : (
          <>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-primary-foreground rounded-md font-display text-2xl tracking-wider hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-wait"
            >
              {saved ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Check className="w-6 h-6" />
                  GUARDADO
                </span>
              ) : isPending ? (
                "GUARDANDO..."
              ) : (
                "GUARDAR PRONÓSTICO"
              )}
            </button>
            {error && (
              <p className="text-xs text-center text-destructive inline-flex items-center justify-center gap-1 w-full">
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

function errorMessage(code: string): string {
  switch (code) {
    case "unauthorized":
      return "Tenés que iniciar sesión.";
    case "not_approved":
      return "Tu cuenta todavía no fue aprobada.";
    case "invalid_input":
      return "El pronóstico no es válido (rango 0-15).";
    case "match_locked":
      return "El partido ya empezó, no se puede modificar.";
    case "match_not_found":
      return "El partido no existe.";
    default:
      return "No pudimos guardar el pronóstico. Probá de nuevo.";
  }
}
