import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/mock-data";
import { PositionMedal } from "./position-medal";

export function LeaderboardCards({
  rows,
  currentUserId,
}: {
  rows: LeaderboardEntry[];
  currentUserId?: string;
}) {
  return (
    <div className="md:hidden space-y-2">
      {rows.map((row) => {
        const isCurrent = row.user.id === currentUserId;
        return (
          <article
            key={row.user.id}
            className={cn(
              "rounded-lg border-2 bg-card p-3 flex items-center gap-3",
              isCurrent ? "border-primary" : "border-border",
            )}
          >
            <PositionMedal rank={row.rank} isTied={row.isTied} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl uppercase truncate">
                  {row.user.name}
                </span>
                {isCurrent && (
                  <span className="text-xs font-bold text-primary">(vos)</span>
                )}
                {row.isTied && (
                  <span className="text-xs text-muted-foreground">empate</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {row.exactCount} exactos · {row.signCount} signos · {row.wrongCount} errados
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl text-primary leading-none tabular-nums">
                {row.totalPoints}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                pts
              </div>
            </div>
            <div className="pl-1">
              {row.hasPaid ? (
                <Check className="w-5 h-5 text-[color:var(--correct-sign)]" />
              ) : (
                <X className="w-5 h-5 text-destructive" />
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
