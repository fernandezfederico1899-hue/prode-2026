import { cn } from "@/lib/utils";

const config: Record<number, { emoji: string; ring: string }> = {
  1: { emoji: "🥇", ring: "ring-accent" },
  2: { emoji: "🥈", ring: "ring-[#C0C0C0]" },
  3: { emoji: "🥉", ring: "ring-[#CD7F32]" },
};

export function PositionMedal({
  rank,
  isTied,
  className,
}: {
  rank: number;
  isTied?: boolean;
  className?: string;
}) {
  const medal = config[rank];
  if (medal) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-full text-2xl ring-2",
          medal.ring,
          className,
        )}
        aria-label={`Posición ${rank}${isTied ? " (empate)" : ""}`}
      >
        {medal.emoji}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted",
        "font-display text-2xl text-muted-foreground tabular-nums",
        className,
      )}
      aria-label={`Posición ${rank}${isTied ? " (empate)" : ""}`}
    >
      {rank}
    </span>
  );
}
