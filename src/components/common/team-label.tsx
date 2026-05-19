import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

type TeamLabelProps = {
  team: Team;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
};

const sizes = {
  sm: { flag: "w-5 h-[15px]", text: "text-sm" },
  md: { flag: "w-7 h-[21px]", text: "text-base" },
  lg: { flag: "w-10 h-[30px]", text: "text-xl" },
};

export function TeamLabel({
  team,
  size = "md",
  showName = true,
  className,
}: TeamLabelProps) {
  const s = sizes[size];
  // country-flag-icons serves SVG via CDN; for a mockup we use the css-class approach
  const FlagComponent = `${team.flagCode.toUpperCase()}` as const;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-block overflow-hidden rounded-[2px] border border-border shrink-0",
          s.flag,
        )}
        aria-label={`Bandera de ${team.name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/${team.flagCode}.svg`}
          alt=""
          className="block w-full h-full object-cover"
          aria-hidden="true"
        />
        <span className="sr-only">{FlagComponent}</span>
      </span>
      {showName && (
        <span className={cn("font-semibold uppercase tracking-wide", s.text)}>
          {team.name}
        </span>
      )}
    </span>
  );
}
