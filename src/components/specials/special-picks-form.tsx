"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import {
  teams,
  players,
  SPECIAL_BONUSES,
  type SpecialPicks,
} from "@/lib/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const teamsSorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));
const playersSorted = [...players].sort((a, b) => a.name.localeCompare(b.name));

type Field = {
  key: keyof SpecialPicks;
  label: string;
  points: number;
  options: "teams" | "players";
};

const FIELDS: Field[] = [
  { key: "championTeamId", label: SPECIAL_BONUSES.champion.label, points: SPECIAL_BONUSES.champion.points, options: "teams" },
  { key: "runnerUpTeamId", label: SPECIAL_BONUSES.runnerUp.label, points: SPECIAL_BONUSES.runnerUp.points, options: "teams" },
  { key: "thirdPlaceTeamId", label: SPECIAL_BONUSES.thirdPlace.label, points: SPECIAL_BONUSES.thirdPlace.points, options: "teams" },
  { key: "topScorerPlayerId", label: SPECIAL_BONUSES.topScorer.label, points: SPECIAL_BONUSES.topScorer.points, options: "players" },
  { key: "bestPlayerId", label: SPECIAL_BONUSES.bestPlayer.label, points: SPECIAL_BONUSES.bestPlayer.points, options: "players" },
  { key: "mostGoalsTeamId", label: SPECIAL_BONUSES.mostGoals.label, points: SPECIAL_BONUSES.mostGoals.points, options: "teams" },
];

export function SpecialPicksForm({
  initialPicks,
  locked,
}: {
  initialPicks: SpecialPicks;
  locked: boolean;
}) {
  const [picks, setPicks] = useState<SpecialPicks>(initialPicks);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const totalPossiblePoints = FIELDS.reduce((acc, f) => acc + f.points, 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border-2 border-border bg-card p-5 md:p-8 space-y-6"
    >
      <div className="grid gap-5">
        {FIELDS.map((field) => (
          <PickField
            key={field.key}
            field={field}
            value={picks[field.key]}
            onChange={(v) =>
              setPicks((prev) => ({ ...prev, [field.key]: v }))
            }
            disabled={locked}
          />
        ))}
      </div>

      <div className="border-t border-border pt-6">
        {locked ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wide">
            <Lock className="w-4 h-4" />
            Pronósticos cerrados (el Mundial ya empezó)
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-4 text-sm">
              <span className="text-muted-foreground">Máximo posible:</span>
              <span className="font-display text-2xl text-primary tabular-nums">
                {totalPossiblePoints} pts
              </span>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-primary text-primary-foreground rounded-md font-display text-2xl tracking-wider hover:opacity-90 transition-opacity"
            >
              {saved ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Check className="w-6 h-6" />
                  GUARDADO
                </span>
              ) : (
                "GUARDAR PRONÓSTICOS ESPECIALES"
              )}
            </button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Se cierran al kickoff del primer partido del Mundial.
            </p>
          </>
        )}
      </div>
    </form>
  );
}

function PickField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: Field;
  value: string | null;
  onChange: (id: string | null) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="font-bold uppercase tracking-wide text-sm">
          {field.label}
        </label>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md border-2 border-accent bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider tabular-nums">
          +{field.points} pts
        </span>
      </div>

      <Select
        value={value ?? undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              field.options === "teams" ? "Elegí un equipo..." : "Elegí un jugador..."
            }
          />
        </SelectTrigger>
        <SelectContent>
          {field.options === "teams"
            ? teamsSorted.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/${t.flagCode}.svg`}
                    alt=""
                    className="w-5 h-[15px] rounded-sm border border-border object-cover"
                  />
                  <span>{t.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    Grupo {t.groupLetter}
                  </span>
                </SelectItem>
              ))
            : playersSorted.map((p) => {
                const team = teams.find((t) => t.id === p.teamId)!;
                return (
                  <SelectItem key={p.id} value={p.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://flagcdn.com/${team.flagCode}.svg`}
                      alt=""
                      className="w-5 h-[15px] rounded-sm border border-border object-cover"
                    />
                    <span className="font-semibold">{p.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {team.fifaCode} · {p.position}
                    </span>
                  </SelectItem>
                );
              })}
        </SelectContent>
      </Select>
    </div>
  );
}
