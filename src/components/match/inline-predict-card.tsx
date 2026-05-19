"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clock, Loader2, Lock, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchWithTeams, Prediction } from "@/lib/types";
import { TeamLabel } from "@/components/common/team-label";
import {
  deletePredictionAction,
  submitPredictionAction,
} from "@/server/actions/predictions";

type SaveState = "idle" | "saving" | "saved" | "error";

const TIME_FORMAT = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});
const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

const AUTOSAVE_DELAY_MS = 600;

export function InlinePredictCard({
  match,
  userPrediction,
}: {
  match: MatchWithTeams;
  userPrediction?: Prediction;
}) {
  const [home, setHome] = useState<string>(
    userPrediction?.homeScore?.toString() ?? "",
  );
  const [away, setAway] = useState<string>(
    userPrediction?.awayScore?.toString() ?? "",
  );
  const [state, setState] = useState<SaveState>(
    userPrediction ? "saved" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lock si el kickoff ya pasó (defensa client; el server también valida).
  const locked = match.kickoffAt.getTime() <= Date.now();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef<string>(""); // "home-away" del último envío exitoso

  // Cleanup del timer al desmontar.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const tryAutoSave = (nextHome: string, nextAway: string) => {
    if (locked) return;
    if (nextHome === "" || nextAway === "") return;
    const h = parseInt(nextHome, 10);
    const a = parseInt(nextAway, 10);
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0 || h > 15 || a > 15) {
      setState("error");
      setErrorMsg("Score inválido (0-15)");
      return;
    }
    const key = `${h}-${a}`;
    if (key === lastSent.current) return; // sin cambios desde el último save OK

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setState("idle");
    saveTimer.current = setTimeout(async () => {
      setState("saving");
      setErrorMsg(null);
      const res = await submitPredictionAction({
        matchId: match.id,
        homeScore: h,
        awayScore: a,
      });
      if (res.ok) {
        lastSent.current = key;
        setState("saved");
      } else {
        setState("error");
        setErrorMsg(humanError(res.error));
      }
    }, AUTOSAVE_DELAY_MS);
  };

  const onHomeChange = (v: string) => {
    setHome(v);
    tryAutoSave(v, away);
  };
  const onAwayChange = (v: string) => {
    setAway(v);
    tryAutoSave(home, v);
  };

  const handleDelete = async () => {
    if (locked || state === "saving") return;
    if (!confirm("¿Borrar tu pronóstico de este partido?")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // Si nunca se guardó (no hay prediction inicial), solo limpiamos local.
    const wasPersisted = lastSent.current !== "" || userPrediction !== undefined;
    setHome("");
    setAway("");
    if (!wasPersisted) {
      setState("idle");
      setErrorMsg(null);
      return;
    }
    setState("saving");
    setErrorMsg(null);
    const res = await deletePredictionAction({ matchId: match.id });
    if (res.ok) {
      lastSent.current = "";
      setState("idle");
    } else {
      setState("error");
      setErrorMsg(humanError(res.error));
    }
  };

  return (
    <article
      className={cn(
        "relative rounded-lg border-2 bg-card p-4 md:p-5 transition-all",
        state === "saved" && "border-green-500/40",
        state === "error" && "border-destructive",
        state !== "saved" && state !== "error" && "border-border",
      )}
    >
      <header className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {DATE_FORMAT.format(match.kickoffAt)}
            {" · "}
            {TIME_FORMAT.format(match.kickoffAt)}
          </span>
        </div>
        <span className="font-display text-base text-foreground">
          {match.stage === "group" && `GRUPO ${match.groupLetter}`}
          {match.stage === "round_of_32" && "16AVOS"}
          {match.stage === "round_of_16" && "OCTAVOS"}
          {match.stage === "quarter" && "CUARTOS"}
          {match.stage === "semi" && "SEMIS"}
          {match.stage === "final" && "FINAL"}
          {match.stage === "third_place" && "3° PUESTO"}
        </span>
      </header>

      <div className="space-y-2">
        <TeamInputRow
          team={match.homeTeam}
          value={home}
          onChange={onHomeChange}
          disabled={locked || state === "saving"}
        />
        <TeamInputRow
          team={match.awayTeam}
          value={away}
          onChange={onAwayChange}
          disabled={locked || state === "saving"}
        />
      </div>

      <footer className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3 text-sm">
        <SaveIndicator state={state} locked={locked} error={errorMsg} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            +3 exacto · +1 signo
          </span>
          {!locked && (home !== "" || away !== "") && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={state === "saving"}
              title="Borrar pronóstico"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

function TeamInputRow({
  team,
  value,
  onChange,
  disabled,
}: {
  team: MatchWithTeams["homeTeam"];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <TeamLabel team={team} size="md" />
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={15}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="—"
        className="font-display text-3xl text-center w-16 h-12 rounded-md border-2 border-border bg-background tabular-nums focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function SaveIndicator({
  state,
  locked,
  error,
}: {
  state: SaveState;
  locked: boolean;
  error: string | null;
}) {
  if (locked) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Lock className="w-3.5 h-3.5" />
        Cerrado
      </span>
    );
  }
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Guardando…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
        <Check className="w-3.5 h-3.5" />
        Guardado
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <AlertCircle className="w-3.5 h-3.5" />
        {error ?? "Error"}
      </span>
    );
  }
  return (
    <span className="text-muted-foreground italic text-xs">
      Cargá tu pronóstico
    </span>
  );
}

function humanError(code: string): string {
  switch (code) {
    case "unauthorized":
      return "No autenticado";
    case "not_approved":
      return "Cuenta no aprobada";
    case "match_locked":
      return "Partido cerrado";
    case "match_not_found":
      return "Partido no encontrado";
    case "invalid_input":
      return "Score inválido";
    default:
      return "Error al guardar";
  }
}
