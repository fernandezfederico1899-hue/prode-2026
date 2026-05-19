import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMatchByIdWithTeams } from "@/server/queries/matches";
import { getAllPredictionsForMatch } from "@/server/queries/predictions";
import { auth } from "@/lib/auth";
import { TeamLabel } from "@/components/common/team-label";
import { StatusBadge } from "@/components/common/status-badge";

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = await getMatchByIdWithTeams(matchId);
  if (!match) notFound();

  const session = await auth();
  const currentUserId = session?.user?.id ?? "";

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const showOthers = isLive || isFinished;
  const otherPreds = showOthers ? await getAllPredictionsForMatch(match.id) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      <Link
        href="/matches"
        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <article
        className={cn(
          "rounded-xl border-2 bg-card p-6 md:p-10",
          isLive ? "border-[color:var(--live)]" : "border-border",
        )}
      >
        <header className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-6">
          <span>
            {match.stage === "group"
              ? `Grupo ${match.groupLetter}`
              : match.stage.replace("_", " ")}
          </span>
          {isLive ? (
            <StatusBadge status="live" />
          ) : (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {DATE_FORMAT.format(match.kickoffAt)}
            </span>
          )}
        </header>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <TeamLabel team={match.homeTeam} size="lg" showName={false} />
            <span className="font-display text-xl md:text-2xl">
              {match.homeTeam.name}
            </span>
          </div>

          <div className="font-display text-7xl md:text-9xl text-foreground tabular-nums leading-none">
            {showOthers ? (
              <>
                {match.homeScore}
                <span className="text-muted-foreground/40 mx-2">·</span>
                {match.awayScore}
              </>
            ) : (
              <span className="text-muted-foreground/40 text-5xl md:text-7xl">
                VS
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <TeamLabel team={match.awayTeam} size="lg" showName={false} />
            <span className="font-display text-xl md:text-2xl">
              {match.awayTeam.name}
            </span>
          </div>
        </div>

        <footer className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {match.venue}
          </div>
        </footer>
      </article>

      {/* Pronósticos de todos (revela post-kickoff) */}
      {showOthers && otherPreds.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl mb-4">PRONÓSTICOS</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {otherPreds.map((p) => {
              const isCurrent = p.user.id === currentUserId;
              const isExact =
                isFinished &&
                p.homeScore === match.homeScore &&
                p.awayScore === match.awayScore;
              const isSign =
                isFinished &&
                !isExact &&
                Math.sign(p.homeScore - p.awayScore) ===
                  Math.sign((match.homeScore ?? 0) - (match.awayScore ?? 0));

              return (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-lg border-2 bg-card p-3 flex items-center gap-3",
                    isCurrent ? "border-primary" : "border-border",
                    isExact && "ring-2 ring-accent",
                  )}
                >
                  <div className="flex-1">
                    <div className="font-display text-lg uppercase">
                      {p.user.name}
                      {isCurrent && (
                        <span className="ml-2 text-xs text-primary lowercase">
                          (vos)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-display text-2xl tabular-nums">
                    {p.homeScore}-{p.awayScore}
                  </div>
                  {isFinished && (
                    <div>
                      {isExact && <StatusBadge status="exact" />}
                      {isSign && <StatusBadge status="sign" />}
                      {!isExact && !isSign && <StatusBadge status="wrong" />}
                    </div>
                  )}
                  {isLive && <StatusBadge status="pending" />}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
