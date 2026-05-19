import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchWithTeams, Prediction } from "@/lib/types";
import { TeamLabel } from "@/components/common/team-label";
import { StatusBadge } from "@/components/common/status-badge";

type MatchCardProps = {
  match: MatchWithTeams;
  userPrediction?: Prediction;
  href?: string;
};

const TIME_FORMAT = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});
const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

function getPredictionStatus(
  match: MatchWithTeams,
  prediction: Prediction | undefined,
): "exact" | "sign" | "wrong" | "pending" | "loaded" {
  if (!prediction) return "pending";
  if (match.status === "scheduled") return "loaded";
  if (match.status === "live") return "loaded";
  if (
    match.homeScore === null ||
    match.awayScore === null ||
    match.status !== "finished"
  ) {
    return "loaded";
  }
  if (
    prediction.homeScore === match.homeScore &&
    prediction.awayScore === match.awayScore
  ) {
    return "exact";
  }
  const predDiff = Math.sign(prediction.homeScore - prediction.awayScore);
  const realDiff = Math.sign(match.homeScore - match.awayScore);
  return predDiff === realDiff ? "sign" : "wrong";
}

export function MatchCard({ match, userPrediction, href }: MatchCardProps) {
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const status = getPredictionStatus(match, userPrediction);
  const showResult = isFinished || isLive;
  const isExactWin = status === "exact" && isFinished;

  const card = (
    <article
      className={cn(
        "relative rounded-lg border-2 bg-card p-4 md:p-5 transition-all",
        "hover:shadow-md",
        isExactWin && "border-accent ring-2 ring-accent/30",
        isLive && "border-[color:var(--live)]",
        !isExactWin && !isLive && "border-border",
      )}
    >
      {/* Header: date/time + group + live indicator */}
      <header className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <StatusBadge status="live" />
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" />
              <span>
                {DATE_FORMAT.format(match.kickoffAt)}{" · "}
                {TIME_FORMAT.format(match.kickoffAt)}
              </span>
            </>
          )}
        </div>
        <span className="font-display text-base text-foreground">
          {match.stage === "group" && `GRUPO ${match.groupLetter}`}
          {match.stage === "round_of_16" && "OCTAVOS"}
          {match.stage === "quarter" && "CUARTOS"}
          {match.stage === "semi" && "SEMIS"}
          {match.stage === "final" && "FINAL"}
          {match.stage === "third_place" && "3° PUESTO"}
        </span>
      </header>

      {/* Teams + scores */}
      <div className="space-y-2">
        <TeamRow
          team={match.homeTeam}
          score={match.homeScore}
          showResult={showResult}
        />
        <TeamRow
          team={match.awayTeam}
          score={match.awayScore}
          showResult={showResult}
        />
      </div>

      {/* Footer: prediction or venue */}
      <footer className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3">
        {userPrediction ? (
          <>
            <span className="text-sm text-muted-foreground">
              Tu pronóstico:{" "}
              <span className="font-bold text-foreground tabular-nums">
                {userPrediction.homeScore}-{userPrediction.awayScore}
              </span>
            </span>
            <StatusBadge status={status} />
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
              {match.venue && (
                <>
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{match.venue}</span>
                </>
              )}
            </span>
            <StatusBadge status="pending" />
          </>
        )}
      </footer>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}

function TeamRow({
  team,
  score,
  showResult,
}: {
  team: MatchWithTeams["homeTeam"];
  score: number | null;
  showResult: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <TeamLabel team={team} size="md" />
      {showResult && score !== null ? (
        <span className="font-display text-4xl leading-none tabular-nums">
          {score}
        </span>
      ) : (
        <span className="font-display text-2xl text-muted-foreground/40">
          —
        </span>
      )}
    </div>
  );
}
