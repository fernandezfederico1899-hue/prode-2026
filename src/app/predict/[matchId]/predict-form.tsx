"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import type { MatchWithTeams } from "@/lib/types";
import { ScoreInput } from "@/components/match/score-input";

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
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 2500);
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
        disabled={locked}
      />

      <div className="mt-8 space-y-3">
        {locked ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wide">
            <Lock className="w-4 h-4" />
            Pronóstico cerrado (partido ya empezó)
          </div>
        ) : (
          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-md font-display text-2xl tracking-wider hover:opacity-90 transition-opacity"
          >
            {submitted ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Check className="w-6 h-6" />
                GUARDADO
              </span>
            ) : (
              "GUARDAR PRONÓSTICO"
            )}
          </button>
        )}
        <p className="text-xs text-center text-muted-foreground">
          Mockup visual. La lógica real se conecta cuando arranquemos M1.
        </p>
      </div>
    </form>
  );
}
