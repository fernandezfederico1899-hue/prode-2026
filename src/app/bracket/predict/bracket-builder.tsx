"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, Check, Lock, Trophy } from "lucide-react";
import { matchNumLabel } from "@/lib/bracket-format";
import { saveBracketPicksAction } from "@/server/actions/bracket-picks";

export type TeamLite = {
  id: string;
  name: string;
  fifaCode: string;
  flagCode: string;
};

export type BuilderMatch = {
  matchNum: number;
  stage: string;
  homeTeam: TeamLite | null;
  awayTeam: TeamLite | null;
  homeSourceMatchNum: number | null;
  awaySourceMatchNum: number | null;
};

const ROUNDS: { stage: string; label: string }[] = [
  { stage: "round_of_32", label: "16AVOS" },
  { stage: "round_of_16", label: "OCTAVOS" },
  { stage: "quarter", label: "CUARTOS" },
  { stage: "semi", label: "SEMIS" },
  { stage: "final", label: "FINAL" },
];

const TOTAL_PICKS = 31;

export function BracketBuilder({
  matches,
  initialPicks,
  locked,
}: {
  matches: BuilderMatch[];
  initialPicks: Record<number, string>;
  locked: boolean;
}) {
  const [picks, setPicks] = useState<Record<number, string>>(initialPicks);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nodeByNum = useMemo(
    () => new Map(matches.map((m) => [m.matchNum, m])),
    [matches],
  );

  // Catálogo de equipos: todos provienen de los cruces de 16avos.
  const teamById = useMemo(() => {
    const map = new Map<string, TeamLite>();
    for (const m of matches) {
      if (m.homeTeam) map.set(m.homeTeam.id, m.homeTeam);
      if (m.awayTeam) map.set(m.awayTeam.id, m.awayTeam);
    }
    return map;
  }, [matches]);

  // Los dos contendientes de un cruce, según la ronda y los picks actuales.
  function contendersOf(
    matchNum: number,
    current: Record<number, string>,
  ): [TeamLite | null, TeamLite | null] {
    const node = nodeByNum.get(matchNum);
    if (!node) return [null, null];
    if (node.stage === "round_of_32") {
      return [node.homeTeam, node.awayTeam];
    }
    const home =
      node.homeSourceMatchNum != null
        ? (teamById.get(current[node.homeSourceMatchNum]) ?? null)
        : null;
    const away =
      node.awaySourceMatchNum != null
        ? (teamById.get(current[node.awaySourceMatchNum]) ?? null)
        : null;
    return [home, away];
  }

  // Al elegir un ganador, invalidar en cascada los cruces aguas abajo cuyo
  // contendiente cambió y dejó de ser válido.
  function pickWinner(matchNum: number, teamId: string) {
    if (locked) return;
    setError(null);
    setSaved(false);
    setPicks((prev) => {
      const next = { ...prev, [matchNum]: teamId };
      cascadeInvalidate(matchNum, next);
      return next;
    });
  }

  function cascadeInvalidate(changed: number, draft: Record<number, string>) {
    const parent = matches.find(
      (m) =>
        m.homeSourceMatchNum === changed || m.awaySourceMatchNum === changed,
    );
    if (!parent) return;
    const ids = contendersOf(parent.matchNum, draft).map((t) => t?.id);
    const cur = draft[parent.matchNum];
    if (cur && !ids.includes(cur)) {
      delete draft[parent.matchNum];
      cascadeInvalidate(parent.matchNum, draft);
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const payload = {
        picks: Object.entries(picks).map(([matchNum, winnerTeamId]) => ({
          matchNum: Number(matchNum),
          winnerTeamId,
        })),
      };
      const res = await saveBracketPicksAction(payload);
      if (!res.ok) {
        setError(errorMessage(res.error));
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  const completed = Object.keys(picks).length;
  const champion = picks[104] ? teamById.get(picks[104]) : null;

  return (
    <div className="space-y-8 pb-28">
      {champion && (
        <div className="rounded-xl border-2 border-accent bg-accent/10 p-5 flex items-center justify-center gap-3 text-center">
          <Trophy className="w-7 h-7 text-accent shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Tu campeón
            </p>
            <p className="font-display text-2xl md:text-3xl flex items-center gap-2 justify-center">
              <Flag team={champion} />
              {champion.name}
            </p>
          </div>
        </div>
      )}

      {ROUNDS.map(({ stage, label }) => {
        const roundMatches = matches.filter((m) => m.stage === stage);
        return (
          <section key={stage}>
            <header className="flex items-baseline justify-between mb-3 md:mb-4 border-b-2 border-primary/40 pb-2">
              <h2 className="font-display text-2xl md:text-3xl text-primary">
                {label}
              </h2>
              <span className="text-xs text-muted-foreground">
                {roundMatches.filter((m) => picks[m.matchNum]).length}/
                {roundMatches.length}
              </span>
            </header>
            <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {roundMatches.map((m) => {
                const [home, away] = contendersOf(m.matchNum, picks);
                return (
                  <MatchCard
                    key={m.matchNum}
                    matchNum={m.matchNum}
                    home={home}
                    away={away}
                    pickedId={picks[m.matchNum] ?? null}
                    locked={locked}
                    onPick={pickWinner}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Barra de acción fija */}
      <div className="fixed bottom-0 inset-x-0 z-20 border-t-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-bold tabular-nums">
              {completed}/{TOTAL_PICKS}
            </span>{" "}
            <span className="text-muted-foreground">cruces elegidos</span>
            {error && (
              <p className="text-xs text-destructive inline-flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>
          {locked ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-wide">
              <Lock className="w-4 h-4" />
              Cuadro cerrado
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || completed === 0}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-display text-lg tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saved ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  GUARDADO
                </span>
              ) : isPending ? (
                "GUARDANDO..."
              ) : (
                "GUARDAR CUADRO"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  matchNum,
  home,
  away,
  pickedId,
  locked,
  onPick,
}: {
  matchNum: number;
  home: TeamLite | null;
  away: TeamLite | null;
  pickedId: string | null;
  locked: boolean;
  onPick: (matchNum: number, teamId: string) => void;
}) {
  return (
    <article className="rounded-md border-2 border-border bg-card overflow-hidden">
      <header className="px-2.5 py-1.5 bg-primary/10 border-b border-border text-[10px] font-bold uppercase tracking-wider text-primary text-center">
        {matchNumLabel(matchNum)}
      </header>
      <TeamButton
        team={home}
        selected={pickedId != null && pickedId === home?.id}
        dimmed={pickedId != null && home != null && pickedId !== home.id}
        locked={locked}
        onClick={() => home && onPick(matchNum, home.id)}
      />
      <div className="h-px bg-border" />
      <TeamButton
        team={away}
        selected={pickedId != null && pickedId === away?.id}
        dimmed={pickedId != null && away != null && pickedId !== away.id}
        locked={locked}
        onClick={() => away && onPick(matchNum, away.id)}
      />
    </article>
  );
}

function TeamButton({
  team,
  selected,
  dimmed,
  locked,
  onClick,
}: {
  team: TeamLite | null;
  selected: boolean;
  dimmed: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  if (!team) {
    return (
      <div className="flex items-center px-3 py-3 text-xs italic text-muted-foreground/60">
        A definir
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={`w-full flex items-center gap-2 px-3 py-3 text-left transition-colors ${
        selected
          ? "bg-primary/15 ring-1 ring-inset ring-primary"
          : dimmed
            ? "opacity-50 hover:opacity-100 hover:bg-muted/40"
            : "hover:bg-muted/40"
      } ${locked ? "cursor-default" : "cursor-pointer"}`}
    >
      <Flag team={team} />
      <span className={`text-sm truncate ${selected ? "font-bold" : ""}`}>
        {team.name}
      </span>
      {selected && (
        <Check className="w-4 h-4 ml-auto text-primary shrink-0" />
      )}
    </button>
  );
}

function Flag({ team }: { team: TeamLite }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${team.flagCode}.svg`}
      alt=""
      className="w-5 h-[15px] rounded-sm border border-border object-cover shrink-0"
    />
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case "unauthorized":
      return "Tenés que iniciar sesión.";
    case "not_approved":
      return "Tu cuenta todavía no fue aprobada.";
    case "locked":
      return "El cuadro ya está cerrado (empezaron los 16avos).";
    case "inconsistent":
      return "Hay cruces inconsistentes, recargá la página.";
    case "invalid_input":
    case "invalid_match":
      return "El cuadro no es válido.";
    default:
      return "No pudimos guardar el cuadro. Probá de nuevo.";
  }
}
