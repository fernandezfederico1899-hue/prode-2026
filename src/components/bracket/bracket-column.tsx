import type { BracketMatch as BracketMatchType } from "@/lib/mock-data";
import { BracketMatch } from "./bracket-match";

export function BracketColumn({
  title,
  matches,
}: {
  title: string;
  matches: BracketMatchType[];
}) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <h3 className="font-display text-xl md:text-2xl text-foreground uppercase tracking-wide text-center sticky top-0 bg-background pb-2 z-10 border-b-2 border-border">
        {title}
      </h3>
      <div className="flex flex-col gap-3 md:gap-4 flex-1 justify-around">
        {matches
          .sort((a, b) => a.position - b.position)
          .map((m) => (
            <BracketMatch key={m.id} match={m} />
          ))}
      </div>
    </div>
  );
}
