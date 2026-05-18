import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/mock-data";
import { PositionMedal } from "./position-medal";

export function LeaderboardTable({
  rows,
  currentUserId,
}: {
  rows: LeaderboardEntry[];
  currentUserId?: string;
}) {
  return (
    <div className="hidden md:block overflow-hidden rounded-lg border-2 border-border bg-card">
      <table className="w-full tabular-nums">
        <thead className="bg-secondary text-secondary-foreground">
          <tr className="text-left text-xs font-bold uppercase tracking-wider">
            <th className="px-4 py-3 w-16 text-center">#</th>
            <th className="px-4 py-3">Jugador</th>
            <th className="px-4 py-3 text-right">Puntos</th>
            <th className="px-4 py-3 text-right">Exactos</th>
            <th className="px-4 py-3 text-right">Signos</th>
            <th className="px-4 py-3 text-right">Errados</th>
            <th className="px-4 py-3 text-center w-20">Pagó</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isCurrent = row.user.id === currentUserId;
            return (
              <tr
                key={row.user.id}
                className={cn(
                  "border-t border-border transition-colors",
                  isCurrent && "bg-primary/5",
                  !isCurrent && idx % 2 === 1 && "bg-muted/30",
                )}
              >
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <PositionMedal rank={row.rank} isTied={row.isTied} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-display text-xl uppercase">
                    {row.user.name}
                    {isCurrent && (
                      <span className="ml-2 font-sans text-xs font-bold text-primary lowercase">
                        (vos)
                      </span>
                    )}
                  </div>
                  {row.isTied && (
                    <div className="text-xs text-muted-foreground">empate</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-display text-3xl text-primary">
                    {row.totalPoints}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {row.exactCount}
                </td>
                <td className="px-4 py-3 text-right">{row.signCount}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {row.wrongCount}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.hasPaid ? (
                    <Check className="inline w-5 h-5 text-[color:var(--correct-sign)]" />
                  ) : (
                    <X className="inline w-5 h-5 text-destructive" />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
