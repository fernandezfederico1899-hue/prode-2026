"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Lock } from "lucide-react";
import type { Team } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitSpecialPicksAction } from "@/server/actions/specials";

type Picks = {
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  thirdPlaceTeamId: string | null;
  mostGoalsTeamId: string | null;
};

const TEAM_FIELDS: Array<{
  key: keyof Picks;
  label: string;
  points: number;
}> = [
  { key: "championTeamId", label: "Campeón", points: 20 },
  { key: "runnerUpTeamId", label: "Subcampeón", points: 10 },
  { key: "thirdPlaceTeamId", label: "Tercer puesto", points: 5 },
  { key: "mostGoalsTeamId", label: "País más goleador", points: 5 },
];

export function SpecialPicksForm({
  teams,
  initialPicks,
  locked,
}: {
  teams: Team[];
  initialPicks: Picks;
  locked: boolean;
}) {
  const [picks, setPicks] = useState<Picks>(initialPicks);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const teamsSorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  const totalMax = TEAM_FIELDS.reduce((acc, f) => acc + f.points, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitSpecialPicksAction(picks);
      if (!result.ok) {
        setError(errorMessage(result.error));
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border-2 border-border bg-card p-5 md:p-8 space-y-6"
    >
      <div className="grid gap-5">
        {TEAM_FIELDS.map((field) => (
          <PickField
            key={field.key}
            label={field.label}
            points={field.points}
            value={picks[field.key]}
            onChange={(v) =>
              setPicks((prev) => ({ ...prev, [field.key]: v }))
            }
            disabled={locked || isPending}
            options={teamsSorted}
          />
        ))}

        {/* Goleador y mejor jugador: pendientes (necesitan tabla players seedeada) */}
        <div className="rounded-md border-2 border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <strong>Goleador (+15)</strong> y <strong>Mejor jugador (+10)</strong>{" "}
          se habilitan antes del kickoff cuando carguemos la lista oficial de
          jugadores.
        </div>
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
              <span className="text-muted-foreground">Máximo disponible:</span>
              <span className="font-display text-2xl text-primary tabular-nums">
                {totalMax} pts
              </span>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-primary-foreground rounded-md font-display text-2xl tracking-wider hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-wait"
            >
              {saved ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Check className="w-6 h-6" />
                  GUARDADO
                </span>
              ) : isPending ? (
                "GUARDANDO..."
              ) : (
                "GUARDAR PRONÓSTICOS"
              )}
            </button>
            {error && (
              <p className="mt-3 text-xs text-center text-destructive inline-flex items-center justify-center gap-1 w-full">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
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
  label,
  points,
  value,
  onChange,
  disabled,
  options,
}: {
  label: string;
  points: number;
  value: string | null;
  onChange: (v: string | null) => void;
  disabled: boolean;
  options: Team[];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="font-bold uppercase tracking-wide text-sm">
          {label}
        </label>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md border-2 border-accent bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider tabular-nums">
          +{points} pts
        </span>
      </div>

      <Select
        value={value ?? undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Elegí un equipo..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/${t.flagCode}.svg`}
                alt=""
                className="w-5 h-[15px] rounded-sm border border-border object-cover"
              />
              <span>{t.name}</span>
              {t.groupLetter && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Grupo {t.groupLetter}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case "unauthorized":
      return "Tenés que iniciar sesión.";
    case "not_approved":
      return "Tu cuenta no está aprobada.";
    case "invalid_input":
      return "Faltan campos o son inválidos.";
    case "tournament_started":
      return "El Mundial ya empezó, no se puede modificar.";
    default:
      return "No pudimos guardar. Probá de nuevo.";
  }
}
