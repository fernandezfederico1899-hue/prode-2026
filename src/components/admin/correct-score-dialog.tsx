"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Edit2, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScoreInput } from "@/components/match/score-input";
import { correctMatchScoreAction } from "@/server/actions/admin-matches";
import type { MatchWithTeams } from "@/lib/types";

export function CorrectScoreDialog({ match }: { match: MatchWithTeams }) {
  const [open, setOpen] = useState(false);
  const [home, setHome] = useState(match.homeScore ?? 0);
  const [away, setAway] = useState(match.awayScore ?? 0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await correctMatchScoreAction({
        matchId: match.id,
        homeScore: home,
        awayScore: away,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1200);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Editar resultado"
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border-2 border-border hover:border-primary hover:text-primary transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent
        title={`${match.homeTeam.fifaCode} vs ${match.awayTeam.fifaCode}`}
      >
        <form onSubmit={handleSubmit}>
          <p className="text-xs text-center text-muted-foreground mb-4">
            Setea el score final y marca el partido como{" "}
            <strong>finalizado</strong>. Recalcula puntos de todos los jugadores.
          </p>

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
            disabled={isPending}
            className="w-full mt-8 py-4 bg-primary text-primary-foreground rounded-md font-display text-2xl tracking-wider hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-wait"
          >
            {saved ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Check className="w-6 h-6" />
                GUARDADO
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculando...
              </span>
            ) : (
              "GUARDAR RESULTADO"
            )}
          </button>

          {error && (
            <p className="mt-3 text-xs text-center text-destructive inline-flex items-center justify-center gap-1 w-full">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
