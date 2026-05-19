import Link from "next/link";
import { ArrowRight, Coins, Users } from "lucide-react";
import {
  matches,
  leaderboard,
  userPredictions,
  currentUser,
  tournamentConfig,
} from "@/lib/mock-data";
import { MatchCard } from "@/components/match/match-card";
import { EditableMatchCard } from "@/components/match/editable-match-card";
import { LeaderboardCards } from "@/components/leaderboard/leaderboard-cards";

export default function Home() {
  const upcomingMatches = matches
    .filter((m) => m.status === "scheduled" || m.status === "live")
    .slice(0, 3);
  const topFive = leaderboard.slice(0, 5);
  const myEntry = leaderboard.find((r) => r.user.id === currentUser.id);

  const pendingCount = matches.filter(
    (m) =>
      m.status === "scheduled" && !userPredictions[m.id],
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* Hero / greeting */}
      <section className="panini-pattern rounded-xl border-2 border-border bg-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
              Hola {currentUser.name}
            </p>
            <h1 className="font-display text-4xl md:text-6xl leading-none mt-1">
              MUNDIAL 2026
            </h1>
            <p className="text-muted-foreground mt-2 max-w-md">
              {pendingCount > 0
                ? `Te faltan ${pendingCount} pronósticos por cargar.`
                : "Estás al día con tus pronósticos."}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/predict"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md font-bold uppercase tracking-wide hover:opacity-90 transition-opacity"
            >
              Cargar pronósticos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mt-6 pt-6 border-t border-border">
          <Stat
            label="Tu puesto"
            value={myEntry ? `${myEntry.rank}°` : "—"}
            sub={myEntry ? `${myEntry.totalPoints} pts` : "sin partidos"}
          />
          <Stat
            label="Pozo"
            value={`$${tournamentConfig.pozoAmountArs.toLocaleString("es-AR")}`}
            sub={`por jugador`}
            icon={<Coins className="w-4 h-4" />}
          />
          <Stat
            label="Jugadores"
            value={`${tournamentConfig.paidCount}/${tournamentConfig.totalCount}`}
            sub="pagaron"
            icon={<Users className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Próximos partidos */}
      <section>
        <SectionHeader title="Próximos partidos" href="/agenda" />
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingMatches.map((m) =>
            m.status === "scheduled" ? (
              <EditableMatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
              />
            ) : (
              <MatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
                href={`/matches/${m.id}`}
              />
            ),
          )}
        </div>
      </section>

      {/* Top 5 */}
      <section>
        <SectionHeader title="Top 5" href="/leaderboard" />
        <LeaderboardCards rows={topFive} currentUserId={currentUser.id} />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl md:text-4xl text-primary leading-none mt-1 tabular-nums">
        {value}
      </div>
      <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
        {sub}
      </div>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      <Link
        href={href}
        className="text-sm font-bold uppercase tracking-wide text-primary hover:underline inline-flex items-center gap-1"
      >
        Ver todo <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
