import Link from "next/link";
import { ArrowRight, Coins, Network, Trophy, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAllMatchesWithTeams } from "@/server/queries/matches";
import { getUserPredictionsByMatch } from "@/server/queries/predictions";
import { getTournamentConfig } from "@/server/queries/tournament-config";
import { getApprovedCount } from "@/server/queries/users";
import type { Prediction } from "@/lib/types";
import { MatchCard } from "@/components/match/match-card";
import { InlinePredictCard } from "@/components/match/inline-predict-card";

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const userName = session?.user?.name?.split(" ")[0] ?? "";

  const [matches, userPredictions, config, approvedCount] = await Promise.all([
    getAllMatchesWithTeams(),
    userId
      ? getUserPredictionsByMatch(userId)
      : Promise.resolve({} as Record<string, Prediction>),
    getTournamentConfig(),
    getApprovedCount(),
  ]);

  const upcomingMatches = matches
    .filter((m) => m.status === "scheduled" || m.status === "live")
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
    .slice(0, 3);

  const pendingCount = matches.filter(
    (m) => m.status === "scheduled" && !userPredictions[m.id],
  ).length;

  const loadedCount = Object.keys(userPredictions).length;

  const pozoArs = config?.pozoAmountArs ?? 0;
  // Pozo total = pozo por jugador × cantidad de approved (cuando trackeemos
  // pagos lo cambiamos por paid count).
  const pozoTotal = pozoArs * approvedCount;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* Hero / greeting */}
      <section className="panini-pattern rounded-xl border-2 border-border bg-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
              Hola{userName ? ` ${userName}` : ""}
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
            label="Cargados"
            value={`${loadedCount}`}
            sub={`pronósticos`}
          />
          <Stat
            label="Pozo total"
            value={`$${pozoTotal.toLocaleString("es-AR")}`}
            sub={`${approvedCount} jugadores`}
            icon={<Coins className="w-4 h-4" />}
          />
          <Stat
            label="Inicia"
            value={config ? formatDate(config.tournamentStartsAt) : "—"}
            sub="Mundial 2026"
            icon={<Users className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* CTAs especiales: especiales + bracket */}
      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/specials"
          className="block rounded-xl border-2 border-accent bg-gradient-to-r from-accent/15 to-accent/5 p-4 md:p-5 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-9 h-9 md:w-10 md:h-10 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg md:text-xl leading-tight">
                ESPECIALES
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Campeón, goleador y más. +65 pts bonus.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </Link>

        <Link
          href="/bracket"
          className="block rounded-xl border-2 border-secondary bg-gradient-to-r from-secondary/15 to-secondary/5 p-4 md:p-5 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <Network className="w-9 h-9 md:w-10 md:h-10 text-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg md:text-xl leading-tight">
                LLAVE
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Cuadro de eliminatoria. Octavos a la Final.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-secondary group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </Link>
      </div>

      {/* Próximos partidos */}
      {upcomingMatches.length > 0 && (
        <section>
          <SectionHeader title="Próximos partidos" href="/predict" />
          <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((m) =>
              m.status === "scheduled" ? (
                <InlinePredictCard
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
      )}
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

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "short",
  });
}
