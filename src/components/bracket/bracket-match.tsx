import { cn } from "@/lib/utils";
import type { BracketMatch as BracketMatchType } from "@/lib/mock-data";
import { StatusBadge } from "@/components/common/status-badge";

const TIME_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function BracketMatch({ match }: { match: BracketMatchType }) {
  const { team1, team2, team1Score, team2Score, winnerId, status } = match;
  const isFinished = status === "finished";
  const isLive = status === "live";

  return (
    <article
      className={cn(
        "rounded-md border-2 bg-card overflow-hidden w-[200px] md:w-[220px] shrink-0",
        isLive ? "border-[color:var(--live)]" : "border-border",
      )}
    >
      <TeamSlot
        team={team1}
        score={team1Score}
        isWinner={winnerId !== null && team1?.id === winnerId}
        showResult={isFinished || isLive}
      />
      <div className="h-px bg-border" />
      <TeamSlot
        team={team2}
        score={team2Score}
        isWinner={winnerId !== null && team2?.id === winnerId}
        showResult={isFinished || isLive}
      />
      <footer className="px-2.5 py-1.5 bg-muted/30 border-t border-border text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-between">
        {isLive ? (
          <StatusBadge status="live" className="text-[9px] py-0" />
        ) : isFinished ? (
          <span className="font-semibold">Finalizado</span>
        ) : (
          <span className="truncate">{TIME_FORMAT.format(match.kickoffAt)}</span>
        )}
      </footer>
    </article>
  );
}

function TeamSlot({
  team,
  score,
  isWinner,
  showResult,
}: {
  team: BracketMatchType["team1"];
  score: number | null;
  isWinner: boolean;
  showResult: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2.5",
        isWinner && "bg-accent/15",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {team ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagcdn.com/${team.flagCode}.svg`}
              alt=""
              className="w-5 h-[15px] rounded-sm border border-border object-cover shrink-0"
            />
            <span
              className={cn(
                "font-bold uppercase tracking-wide text-sm truncate",
                isWinner ? "text-foreground" : "text-foreground/90",
                showResult && !isWinner && "text-muted-foreground line-through decoration-1",
              )}
            >
              {team.fifaCode}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground italic">A definir</span>
        )}
      </div>
      <span
        className={cn(
          "font-display text-2xl tabular-nums leading-none shrink-0",
          isWinner ? "text-foreground" : "text-muted-foreground/60",
        )}
      >
        {showResult && score !== null ? score : "—"}
      </span>
    </div>
  );
}
