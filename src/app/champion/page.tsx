import Link from "next/link";
import { ArrowLeft, Sparkles, Trophy } from "lucide-react";
import { getLeaderboard } from "@/server/queries/leaderboard";
import {
  getTournamentConfig,
  hasTournamentEnded,
} from "@/server/queries/tournament-config";
import { getAllPayments } from "@/server/queries/admin";
import { ConfettiBurst } from "@/components/champion/confetti-burst";
import { PositionMedal } from "@/components/leaderboard/position-medal";

// Render dinámico: los resultados los actualiza el cron de sync (fuera de
// cualquier revalidatePath), así que no podemos prerenderizar.
export const dynamic = "force-dynamic";

export default async function ChampionPage() {
  const [leaderboard, config, payments, tournamentEnded] = await Promise.all([
    getLeaderboard(),
    getTournamentConfig(),
    getAllPayments(),
    hasTournamentEnded(),
  ]);

  const winner = leaderboard[0];
  const top3 = leaderboard.slice(0, 3);
  const paidCount = payments.filter((p) => p.paid).length;
  const pozoTotal = (config?.pozoAmountArs ?? 0) * paidCount;

  if (!winner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="text-center space-y-4 max-w-md">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="font-display text-3xl">EL MUNDIAL TODAVÍA NO TERMINÓ</h1>
          <p className="text-muted-foreground">
            Esta pantalla aparece cuando el torneo cierra y hay un ganador.
            Volvé después de la final.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden panini-pattern-strong">
      {tournamentEnded && <ConfettiBurst />}

      <Link
        href="/"
        className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-8 relative">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-accent text-accent-foreground shadow-2xl shadow-accent/40 ring-4 ring-accent/30">
            <Trophy className="w-16 h-16" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] font-bold text-accent">
              <Sparkles className="inline w-4 h-4 mr-1" />
              {tournamentEnded ? "Campeón del prode" : "Líder actual"}
              <Sparkles className="inline w-4 h-4 ml-1" />
            </p>
            <h1 className="font-display text-6xl md:text-8xl leading-none mt-2">
              {tournamentEnded ? (
                <>
                  ¡GANÓ
                  <br />
                  <span className="text-primary">EL PRODE!</span>
                </>
              ) : (
                <span className="text-primary">{winner.name.toUpperCase()}</span>
              )}
            </h1>
            {tournamentEnded && (
              <p className="font-display text-2xl md:text-3xl text-muted-foreground mt-3">
                {winner.name.toUpperCase()}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border-4 border-accent bg-gradient-to-br from-accent/20 via-accent/10 to-card p-6 md:p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-muted-foreground mb-2">
            {tournamentEnded ? "Se lleva el pozo" : "Pozo en juego"}
          </p>
          <p className="font-display text-5xl md:text-7xl text-accent tabular-nums leading-none">
            ${pozoTotal.toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            ARS · {paidCount} jugadores × $
            {(config?.pozoAmountArs ?? 0).toLocaleString("es-AR")}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatBlock
            value={winner.totalPoints}
            label="Puntos totales"
            highlight
          />
          <StatBlock value={winner.exactCount} label="Exactos" />
          <StatBlock value={winner.signCount} label="Signos" />
        </div>

        {top3.length > 1 && (
          <div>
            <h3 className="font-display text-2xl mb-3 text-center">
              {tournamentEnded ? "PODIO FINAL" : "PODIO ACTUAL"}
            </h3>
            <div className="space-y-2">
              {top3.map((r) => (
                <div
                  key={r.userId}
                  className={`rounded-lg border-2 p-3 flex items-center gap-3 ${
                    r.rank === 1
                      ? "border-accent bg-accent/10"
                      : r.rank === 2
                        ? "border-[#C0C0C0] bg-card"
                        : "border-[#CD7F32] bg-card"
                  }`}
                >
                  <PositionMedal rank={r.rank} />
                  <div className="flex-1">
                    <div className="font-display text-xl uppercase">
                      {r.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl text-primary tabular-nums leading-none">
                      {r.totalPoints}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!tournamentEnded && (
          <p className="text-xs text-center text-muted-foreground">
            Esta vista se actualiza en tiempo real con el líder actual.
            <br />
            Cuando termine la final, vamos a marcar el ganador definitivo.
          </p>
        )}
      </div>
    </div>
  );
}

function StatBlock({
  value,
  label,
  highlight,
}: {
  value: number | string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border-2 p-3 text-center ${
        highlight ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div
        className={`font-display text-3xl md:text-4xl tabular-nums leading-none ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">
        {label}
      </div>
    </div>
  );
}
