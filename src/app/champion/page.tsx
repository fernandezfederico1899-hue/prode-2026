import Link from "next/link";
import { ArrowLeft, Share2, Sparkles, Trophy } from "lucide-react";
import {
  currentUser,
  leaderboard,
  tournamentConfig,
  teams,
} from "@/lib/mock-data";
import { ConfettiBurst } from "@/components/champion/confetti-burst";
import { PositionMedal } from "@/components/leaderboard/position-medal";

export default function ChampionPage() {
  const winner = leaderboard[0]; // top 1 (Federico en el mock)
  const pozoTotal =
    tournamentConfig.pozoAmountArs * tournamentConfig.paidCount;
  const top3 = leaderboard.slice(0, 3);

  // Bonus picks que acertó (mock — Argentina campeón, Messi goleador)
  const championPick = teams.find((t) => t.fifaCode === "ARG")!;

  return (
    <div className="relative min-h-screen overflow-hidden panini-pattern-strong">
      <ConfettiBurst />

      <Link
        href="/"
        className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-8 relative">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-accent text-accent-foreground shadow-2xl shadow-accent/40 ring-4 ring-accent/30">
            <Trophy className="w-16 h-16" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] font-bold text-accent">
              <Sparkles className="inline w-4 h-4 mr-1" />
              Mundial 2026
              <Sparkles className="inline w-4 h-4 ml-1" />
            </p>
            <h1 className="font-display text-6xl md:text-8xl leading-none mt-2">
              ¡GANASTE
              <br />
              <span className="text-primary">EL PRODE!</span>
            </h1>
            <p className="font-display text-2xl md:text-3xl text-muted-foreground mt-3">
              {winner.user.name.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Premio principal */}
        <div className="rounded-2xl border-4 border-accent bg-gradient-to-br from-accent/20 via-accent/10 to-card p-6 md:p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-muted-foreground mb-2">
            Te llevás el pozo
          </p>
          <p className="font-display text-5xl md:text-7xl text-accent tabular-nums leading-none">
            ${pozoTotal.toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            ARS · {tournamentConfig.paidCount} jugadores × $
            {tournamentConfig.pozoAmountArs.toLocaleString("es-AR")}
          </p>
        </div>

        {/* Stats finales */}
        <div className="grid grid-cols-3 gap-3">
          <StatBlock
            value={winner.totalPoints}
            label="Puntos totales"
            highlight
          />
          <StatBlock value={winner.exactCount} label="Exactos" />
          <StatBlock value={winner.signCount} label="Signos" />
        </div>

        {/* Pronósticos especiales acertados */}
        <div className="rounded-xl border-2 border-border bg-card p-5">
          <h3 className="font-display text-xl mb-3">PRONÓSTICOS ESPECIALES</h3>
          <div className="space-y-2 text-sm">
            <PickRow
              label="Campeón"
              value={`${championPick.name} 🇦🇷`}
              bonus={20}
              correct
            />
            <PickRow
              label="Goleador"
              value="Lionel Messi"
              bonus={15}
              correct
            />
            <PickRow
              label="Mejor jugador"
              value="Lamine Yamal"
              bonus={0}
              correct={false}
            />
          </div>
        </div>

        {/* Top 3 final */}
        <div>
          <h3 className="font-display text-2xl mb-3 text-center">PODIO FINAL</h3>
          <div className="space-y-2">
            {top3.map((r) => (
              <div
                key={r.user.id}
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
                    {r.user.name}
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

        {/* Compartir */}
        <button
          type="button"
          className="w-full py-4 bg-primary text-primary-foreground rounded-md font-display text-2xl tracking-wider hover:opacity-90 transition-opacity inline-flex items-center gap-2 justify-center"
        >
          <Share2 className="w-5 h-5" />
          COMPARTIR RESULTADO
        </button>

        <p className="text-xs text-center text-muted-foreground">
          🚧 Mockup — esta pantalla se mostraría automáticamente al ganador del
          prode al cerrar el torneo. Los stats se calculan de la DB real.
        </p>
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

function PickRow({
  label,
  value,
  bonus,
  correct,
}: {
  label: string;
  value: string;
  bonus: number;
  correct: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground w-24 shrink-0">
          {label}
        </span>
        <span className="truncate">{value}</span>
      </div>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md border-2 text-[10px] font-bold uppercase tracking-wider tabular-nums ${
          correct
            ? "border-accent bg-accent/10 text-accent"
            : "border-muted-foreground/30 text-muted-foreground"
        }`}
      >
        {correct ? `+${bonus} pts` : "Erró"}
      </span>
    </div>
  );
}
