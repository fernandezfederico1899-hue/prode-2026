"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamLabel } from "@/components/common/team-label";
import type { Team } from "@/lib/types";

type ScoreInputProps = {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  onChange: (home: number, away: number) => void;
  disabled?: boolean;
};

const MIN = 0;
const MAX = 15;

export function ScoreInput({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  onChange,
  disabled = false,
}: ScoreInputProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
      <SideInput
        team={homeTeam}
        value={homeScore}
        onChange={(v) => onChange(v, awayScore)}
        disabled={disabled}
      />
      <div className="font-display text-3xl text-muted-foreground self-center pt-12">
        VS
      </div>
      <SideInput
        team={awayTeam}
        value={awayScore}
        onChange={(v) => onChange(homeScore, v)}
        disabled={disabled}
      />
    </div>
  );
}

function SideInput({
  team,
  value,
  onChange,
  disabled,
}: {
  team: Team;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const dec = () => onChange(Math.max(MIN, value - 1));
  const inc = () => onChange(Math.min(MAX, value + 1));

  return (
    <div className="flex flex-col items-center gap-2">
      <TeamLabel team={team} size="sm" showName={false} />
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground text-center">
        {team.name}
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          if (Number.isNaN(n)) onChange(0);
          else onChange(Math.max(MIN, Math.min(MAX, n)));
        }}
        disabled={disabled}
        className={cn(
          "w-20 h-20 rounded-lg border-2 border-border bg-background",
          "text-center font-display text-5xl tabular-nums",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={dec}
          disabled={disabled || value <= MIN}
          aria-label="Restar"
          className="w-11 h-11 rounded-md border-2 border-border bg-card hover:bg-muted disabled:opacity-50 inline-flex items-center justify-center"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={inc}
          disabled={disabled || value >= MAX}
          aria-label="Sumar"
          className="w-11 h-11 rounded-md border-2 border-border bg-card hover:bg-muted disabled:opacity-50 inline-flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
