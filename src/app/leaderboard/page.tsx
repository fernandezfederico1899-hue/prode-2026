import { Coins, Users } from "lucide-react";
import { leaderboard, currentUser, tournamentConfig } from "@/lib/mock-data";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardCards } from "@/components/leaderboard/leaderboard-cards";

export default function LeaderboardPage() {
  const pozoTotal =
    tournamentConfig.paidCount * tournamentConfig.pozoAmountArs;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">TABLA DE POSICIONES</h1>
          <p className="text-muted-foreground mt-1">
            Sistema clásico: 3 pts exacto, 1 pt signo acertado.
          </p>
        </div>

        <div className="flex gap-3">
          <StatPill
            icon={<Coins className="w-4 h-4" />}
            label="Pozo total"
            value={`$${pozoTotal.toLocaleString("es-AR")}`}
          />
          <StatPill
            icon={<Users className="w-4 h-4" />}
            label="Pagaron"
            value={`${tournamentConfig.paidCount}/${tournamentConfig.totalCount}`}
          />
        </div>
      </header>

      <LeaderboardTable rows={leaderboard} currentUserId={currentUser.id} />
      <LeaderboardCards rows={leaderboard} currentUserId={currentUser.id} />

      <footer className="text-xs text-muted-foreground text-center pt-4">
        En caso de empate en puntos, exactos y signos: posición compartida y el
        pozo se reparte en partes iguales.
      </footer>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex-1 md:flex-initial rounded-md border-2 border-border bg-card px-4 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl text-primary leading-none mt-0.5 tabular-nums">
        {value}
      </div>
    </div>
  );
}
