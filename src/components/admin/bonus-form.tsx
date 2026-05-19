"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Save, Calculator } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  resolveBonusAction,
  setBonusResultsAction,
} from "@/server/actions/admin-bonus";
import type { Team, BonusResults } from "@/db/schema";
import type { PlayerWithTeam } from "@/server/queries/players";

type Picks = {
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  thirdPlaceTeamId: string | null;
  mostGoalsTeamId: string | null;
  topScorerPlayerId: string | null;
  bestPlayerId: string | null;
};

export function BonusForm({
  teams,
  players,
  initial,
  bonusResolvedAt,
}: {
  teams: Team[];
  players: PlayerWithTeam[];
  initial: BonusResults | null;
  bonusResolvedAt: Date | null;
}) {
  const router = useRouter();
  const [picks, setPicks] = useState<Picks>({
    championTeamId: initial?.championTeamId ?? null,
    runnerUpTeamId: initial?.runnerUpTeamId ?? null,
    thirdPlaceTeamId: initial?.thirdPlaceTeamId ?? null,
    mostGoalsTeamId: initial?.mostGoalsTeamId ?? null,
    topScorerPlayerId: initial?.topScorerPlayerId ?? null,
    bestPlayerId: initial?.bestPlayerId ?? null,
  });
  const [saving, startSaving] = useTransition();
  const [resolving, startResolving] = useTransition();
  const [saved, setSaved] = useState(false);
  const [resolveResult, setResolveResult] = useState<
    { updated: number; totalBonus: number } | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const teamsSorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  const playersSorted = [...players].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startSaving(async () => {
      const res = await setBonusResultsAction(picks);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const handleResolve = () => {
    setError(null);
    setResolveResult(null);
    if (
      !confirm(
        "Esto recalcula los bonus de TODOS los jugadores y actualiza el leaderboard. ¿Continuar?",
      )
    ) {
      return;
    }
    startResolving(async () => {
      const res = await resolveBonusAction();
      if (res.ok) {
        setResolveResult(res.data);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4">
        <TeamPick
          label="Campeón"
          points={20}
          value={picks.championTeamId}
          onChange={(v) =>
            setPicks((p) => ({ ...p, championTeamId: v }))
          }
          options={teamsSorted}
        />
        <TeamPick
          label="Subcampeón"
          points={10}
          value={picks.runnerUpTeamId}
          onChange={(v) =>
            setPicks((p) => ({ ...p, runnerUpTeamId: v }))
          }
          options={teamsSorted}
        />
        <TeamPick
          label="Tercer puesto"
          points={5}
          value={picks.thirdPlaceTeamId}
          onChange={(v) =>
            setPicks((p) => ({ ...p, thirdPlaceTeamId: v }))
          }
          options={teamsSorted}
        />
        <TeamPick
          label="País más goleador"
          points={5}
          value={picks.mostGoalsTeamId}
          onChange={(v) =>
            setPicks((p) => ({ ...p, mostGoalsTeamId: v }))
          }
          options={teamsSorted}
        />
        <PlayerPick
          label="Goleador (Bota de Oro)"
          points={15}
          value={picks.topScorerPlayerId}
          onChange={(v) =>
            setPicks((p) => ({ ...p, topScorerPlayerId: v }))
          }
          options={playersSorted}
        />
        <PlayerPick
          label="Mejor jugador (Balón de Oro)"
          points={10}
          value={picks.bestPlayerId}
          onChange={(v) =>
            setPicks((p) => ({ ...p, bestPlayerId: v }))
          }
          options={playersSorted}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-md font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 border border-border"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "GUARDADO" : "GUARDAR RESULTADOS"}
        </button>

        <button
          type="button"
          onClick={handleResolve}
          disabled={resolving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md font-display tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {resolving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4" />
          )}
          CALCULAR BONUS
        </button>

        {bonusResolvedAt && !resolveResult && (
          <span className="text-xs text-muted-foreground self-center">
            Última resolución:{" "}
            {new Intl.DateTimeFormat("es-AR", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "America/Argentina/Buenos_Aires",
            }).format(bonusResolvedAt)}
          </span>
        )}
      </div>

      {resolveResult && (
        <div className="rounded-md border-2 border-green-500/30 bg-green-500/5 p-3 text-sm flex items-start gap-2">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <strong>{resolveResult.updated}</strong> pronósticos actualizados.
            Bonus repartidos en total: <strong>{resolveResult.totalBonus}</strong> pts.
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border-2 border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error === "no_results_set"
            ? "Guardá los resultados primero antes de calcular bonus."
            : `Error: ${error}`}
        </div>
      )}
    </div>
  );
}

function TeamPick({
  label,
  points,
  value,
  onChange,
  options,
}: {
  label: string;
  points: number;
  value: string | null;
  onChange: (v: string | null) => void;
  options: Team[];
}) {
  return (
    <PickShell label={label} points={points}>
      <Select
        value={value ?? undefined}
        onValueChange={(v) => onChange(v === "__none__" ? null : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="italic text-muted-foreground">— Sin definir —</span>
          </SelectItem>
          {options.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/${t.flagCode}.svg`}
                alt=""
                className="w-5 h-[15px] rounded-sm border border-border object-cover"
              />
              <span>{t.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PickShell>
  );
}

function PlayerPick({
  label,
  points,
  value,
  onChange,
  options,
}: {
  label: string;
  points: number;
  value: string | null;
  onChange: (v: string | null) => void;
  options: PlayerWithTeam[];
}) {
  return (
    <PickShell label={label} points={points}>
      <Select
        value={value ?? undefined}
        onValueChange={(v) => onChange(v === "__none__" ? null : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="italic text-muted-foreground">— Sin definir —</span>
          </SelectItem>
          {options.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.photoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.photoUrl}
                  alt=""
                  className="w-6 h-6 rounded-full border border-border object-cover bg-muted"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`https://flagcdn.com/${p.team.flagCode}.svg`}
                  alt=""
                  className="w-5 h-[15px] rounded-sm border border-border object-cover"
                />
              )}
              <span className="font-semibold">{p.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {p.team.fifaCode}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PickShell>
  );
}

function PickShell({
  label,
  points,
  children,
}: {
  label: string;
  points: number;
  children: React.ReactNode;
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
      {children}
    </div>
  );
}
