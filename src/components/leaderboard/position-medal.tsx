import { cn } from "@/lib/utils";

const RING_BY_RANK: Record<number, string> = {
  1: "border-accent bg-accent text-accent-foreground shadow-[0_0_0_3px_rgba(212,167,58,0.25)]",
  2: "border-[#C0C0C0] bg-[#C0C0C0] text-zinc-900",
  3: "border-[#CD7F32] bg-[#CD7F32] text-white",
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
  const ringClass = RING_BY_RANK[rank];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-display text-xl tabular-nums leading-none",
        ringClass ??
          "border-border bg-muted text-muted-foreground",
        className,
      )}
      aria-label={`Posición ${rank}${isTied ? " (empate)" : ""}`}
    >
      {rank}
    </span>
  );
}
