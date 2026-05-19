"use client";

import { useState } from "react";
import { Check, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScoreInput } from "@/components/match/score-input";
import type { MatchWithTeams, Prediction } from "@/lib/types";

const KICKOFF_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function PredictSheet({
  match,
  initialPrediction,
  children,
}: {
  match: MatchWithTeams;
  initialPrediction?: Prediction;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [home, setHome] = useState(initialPrediction?.homeScore ?? 0);
  const [away, setAway] = useState(initialPrediction?.awayScore ?? 0);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1200);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent title={`${match.homeTeam.fifaCode} VS ${match.awayTeam.fifaCode}`}>
        <div className="text-center mb-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {KICKOFF_FORMAT.format(match.kickoffAt)}
          </div>
        </div>

        <form onSubmit={handleSave}>
          <ScoreInput
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homeScore={home}
            awayScore={away}
            onChange={(h, a) => {
              setHome(h);
              setAway(a);
            }}
          />

          <button
            type="submit"
            className="w-full mt-8 py-4 bg-primary text-primary-foreground rounded-md font-display text-2xl tracking-wider hover:opacity-90 transition-opacity"
          >
            {saved ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Check className="w-6 h-6" />
                GUARDADO
              </span>
            ) : initialPrediction ? (
              "ACTUALIZAR PRONÓSTICO"
            ) : (
              "GUARDAR PRONÓSTICO"
            )}
          </button>

          <p className="mt-3 text-xs text-center text-muted-foreground">
            El pronóstico se cierra al kickoff del partido.
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}
