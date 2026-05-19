"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import {
  getEligibleRosterTeamsAction,
  syncOneRosterAction,
} from "@/server/actions/admin-rosters";

type Progress = {
  current: number;
  total: number;
  currentTeam: string;
  ok: number;
  fail: number;
  errors: Array<{ team: string; error: string }>;
};

export function SyncRostersButton({ eligibleCount }: { eligibleCount: number }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = async () => {
    const total = eligibleCount;
    const estMin = Math.ceil((total * 7) / 60);
    if (
      !confirm(
        `Esto va a hacer ${total} llamadas a API-Sports (1 por equipo, ~7s c/u). ` +
          `Demora ~${estMin} min. No cierres la pestaña. ¿Continuar?`,
      )
    ) {
      return;
    }

    setRunning(true);
    setDone(false);
    setProgress({
      current: 0,
      total,
      currentTeam: "...",
      ok: 0,
      fail: 0,
      errors: [],
    });

    const teamsList = await getEligibleRosterTeamsAction();
    let ok = 0;
    let fail = 0;
    const errors: Array<{ team: string; error: string }> = [];

    for (let i = 0; i < teamsList.length; i++) {
      const t = teamsList[i];
      setProgress({
        current: i + 1,
        total: teamsList.length,
        currentTeam: t.name,
        ok,
        fail,
        errors,
      });

      const res = await syncOneRosterAction(t.id);
      if (res.ok) {
        ok++;
      } else {
        fail++;
        errors.push({ team: res.teamName, error: res.error });
        // Si pegamos rate limit, parar el loop (sino llenamos errores en vano).
        if (res.error === "rate_limited") {
          errors.push({
            team: "(stop)",
            error: "Quota diaria agotada. Esperá al reset 00:00 UTC y volvé a apretar.",
          });
          break;
        }
      }

      // Rate limit client-side: 7s entre calls = 8.5 r/m (margen seguro).
      if (i < teamsList.length - 1) {
        await new Promise((r) => setTimeout(r, 7000));
      }
    }

    setProgress({
      current: teamsList.length,
      total: teamsList.length,
      currentTeam: "",
      ok,
      fail,
      errors,
    });
    setRunning(false);
    setDone(true);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={running || eligibleCount === 0}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md font-display tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {running ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            SINCRONIZANDO...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            SINCRONIZAR ROSTERS ({eligibleCount})
          </>
        )}
      </button>

      {progress && (
        <div className="rounded-md border-2 border-border bg-card p-4 space-y-2 text-sm">
          {running && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {progress.current} / {progress.total}
                </span>
                <span className="text-muted-foreground text-xs">
                  Procesando: <strong>{progress.currentTeam}</strong>
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            </>
          )}

          {done && (
            <div className="flex items-center gap-2 font-bold text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              Sync terminado
            </div>
          )}

          <ul className="text-muted-foreground space-y-0.5 mt-2">
            <li>
              ✅ OK: <strong>{progress.ok}</strong>
            </li>
            <li>
              ❌ Fallaron: <strong>{progress.fail}</strong>
            </li>
          </ul>

          {progress.errors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="font-bold text-destructive flex items-center gap-1 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                Errores:
              </p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {progress.errors.slice(-10).map((e, i) => (
                  <li key={i}>
                    <strong>{e.team}:</strong> {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
